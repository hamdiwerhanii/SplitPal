import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { createTransport, Transporter } from 'nodemailer';
import { join } from 'path';
import type { Env } from 'src/config/env.validation';
import { Locale } from 'src/user/enums/locale.enum';
import { OTP_EMAIL_COPY } from './mail.copy';

type OtpTemplateContext = (typeof OTP_EMAIL_COPY)[Locale] & {
  code: string;
  minutes: number;
  dir: 'ltr' | 'rtl';
  lang: Locale;
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private otpTemplate: HandlebarsTemplateDelegate<OtpTemplateContext>;

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit() {
    const source = readFileSync(
      join(__dirname, 'templates', 'otp.hbs'),
      'utf8',
    );
    this.otpTemplate = Handlebars.compile<OtpTemplateContext>(source);

    const host = this.config.get('MAIL_HOST', { infer: true });
    if (!host) {
      this.logger.warn('MAIL_HOST is not set: emails are logged, not sent');
      return;
    }

    const user = this.config.get('MAIL_USER', { infer: true });
    this.transporter = createTransport({
      host,
      port: this.config.get('MAIL_PORT', { infer: true }),
      secure: this.config.get('MAIL_SECURE', { infer: true }),
      auth: user
        ? { user, pass: this.config.get('MAIL_PASSWORD', { infer: true }) }
        : undefined,
    });
  }

  async sendOtp(to: string, code: string, locale: Locale): Promise<void> {
    const copy = OTP_EMAIL_COPY[locale] ?? OTP_EMAIL_COPY[Locale.EN];
    const minutes = this.config.get('OTP_TTL_MINUTES', { infer: true });
    const html = this.otpTemplate({
      ...copy,
      code,
      minutes,
      lang: locale,
      dir: locale === Locale.AR ? 'rtl' : 'ltr',
    });

    if (!this.transporter) {
      this.logger.log(`OTP for ${to}: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM', { infer: true }),
      to,
      subject: copy.subject.replace('{{code}}', code),
      text: `${copy.intro} ${code}\n${copy.expires.replace('{{minutes}}', String(minutes))}`,
      html,
    });
  }
}
