import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Env } from 'src/config/env.validation';
import { MailService } from 'src/mail/mail.service';
import { Locale } from 'src/user/enums/locale.enum';
import { UserService } from 'src/user/user.service';
import { UserDocument } from 'src/user/entities/user.entity';
import { OtpCode } from './entities/otp-code.schema';
import { RefreshToken } from './entities/refresh-token.schema';
import type { AuthTokens, JwtPayload } from './types/auth.types';
import {
  generateOtpCode,
  generateSecret,
  hashOtpCode,
  safeEqual,
  sha256,
  splitOpaqueToken,
} from './utils/token.util';

const REUSE_GRACE_MS = 30_000;
const INVALID_CODE = 'Invalid or expired code';

export type OtpRequestResult = {
  message: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type SessionResult = AuthTokens & {
  user: UserDocument;
  isNewUser: boolean;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService<Env, true>,
    @InjectModel(OtpCode.name) private readonly otpModel: Model<OtpCode>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}

  async requestOtp(email: string, locale?: Locale): Promise<OtpRequestResult> {
    const ttlMinutes = this.config.get('OTP_TTL_MINUTES', { infer: true });
    const cooldown = this.config.get('OTP_RESEND_COOLDOWN_SECONDS', {
      infer: true,
    });
    const result: OtpRequestResult = {
      message: 'If the address is valid, a code has been sent.',
      expiresInSeconds: ttlMinutes * 60,
      resendAfterSeconds: cooldown,
    };

    const recent = await this.otpModel.exists({
      email,
      consumedAt: null,
      createdAt: { $gt: new Date(Date.now() - cooldown * 1000) },
    });
    if (recent) {
      return result;
    }

    const code = generateOtpCode();
    await this.otpModel.deleteMany({ email, consumedAt: null });
    await this.otpModel.create({
      email,
      codeHash: hashOtpCode(this.otpSecret, email, code),
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    });

    try {
      await this.mailService.sendOtp(email, code, locale ?? Locale.EN);
    } catch (error) {
      this.logger.error('Failed to send OTP email', (error as Error).stack);
      await this.otpModel.deleteMany({ email, consumedAt: null });
      throw new ServiceUnavailableException(
        'Could not send the code. Please try again.',
      );
    }

    return result;
  }

  async verifyOtp(
    email: string,
    code: string,
    locale?: Locale,
  ): Promise<SessionResult> {
    const maxAttempts = this.config.get('OTP_MAX_ATTEMPTS', { infer: true });
    const otp = await this.otpModel.findOneAndUpdate(
      {
        email,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: maxAttempts },
      },
      { $inc: { attempts: 1 } },
      { sort: { createdAt: -1 }, new: true },
    );

    if (!otp) {
      throw new UnauthorizedException(INVALID_CODE);
    }

    const expected = hashOtpCode(this.otpSecret, email, code);
    if (!safeEqual(expected, otp.codeHash)) {
      throw new UnauthorizedException(INVALID_CODE);
    }

    const consumed = await this.otpModel.findOneAndUpdate(
      { _id: otp._id, consumedAt: null },
      { $set: { consumedAt: new Date() } },
    );
    if (!consumed) {
      throw new UnauthorizedException(INVALID_CODE);
    }

    const { user, isNewUser } = await this.userService.findOrCreateByEmail(
      email,
      locale,
    );
    const tokens = await this.issueTokens(user);
    return { ...tokens, user, isNewUser };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const parts = splitOpaqueToken(refreshToken);
    if (!parts || !Types.ObjectId.isValid(parts.id)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.refreshTokenModel.findById(parts.id);
    if (!stored || !safeEqual(sha256(parts.secret), stored.tokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      const revokedForMs = Date.now() - stored.revokedAt.getTime();
      if (revokedForMs > REUSE_GRACE_MS) {
        this.logger.warn(
          `Refresh token reuse detected for ${stored.user.toString()}`,
        );
        await this.revokeAllForUser(stored.user);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const revoked = await this.refreshTokenModel.findOneAndUpdate(
      { _id: stored._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    if (!revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(stored.user);
    return this.issueTokens(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    const parts = refreshToken ? splitOpaqueToken(refreshToken) : null;
    if (!parts || !Types.ObjectId.isValid(parts.id)) {
      return;
    }
    await this.refreshTokenModel.updateOne(
      { _id: parts.id, tokenHash: sha256(parts.secret), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const secret = generateSecret();
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    const stored = await this.refreshTokenModel.create({
      user: user._id,
      tokenHash: sha256(secret),
      expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
    });

    return { accessToken, refreshToken: `${stored._id.toString()}.${secret}` };
  }

  private async revokeAllForUser(userId: Types.ObjectId): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { user: userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  private get otpSecret(): string {
    return this.config.get('OTP_SECRET', { infer: true });
  }
}
