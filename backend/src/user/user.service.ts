import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Locale } from './enums/locale.enum';
import { User, UserDocument } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findByIds(ids: Types.ObjectId[]) {
    return this.userModel.find({ _id: { $in: ids } });
  }

  async findOrCreateByEmail(
    email: string,
    locale?: Locale,
  ): Promise<{ user: UserDocument; isNewUser: boolean }> {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      return { user: existing, isNewUser: false };
    }

    const user = await this.userModel.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          name: email.split('@')[0].slice(0, 60),
          locale: locale ?? Locale.EN,
        },
      },
      { upsert: true, new: true },
    );
    return { user, isNewUser: true };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { ...dto, ...(dto.name ? { profileCompleted: true } : {}) } },
      { new: true, runValidators: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async addPushToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateMany(
      { pushTokens: token, _id: { $ne: userId } },
      { $pull: { pushTokens: token } },
    );
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { pushTokens: token } },
    );
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { pushTokens: token } },
    );
  }

  async removePushTokenEverywhere(token: string): Promise<void> {
    await this.userModel.updateMany(
      { pushTokens: token },
      { $pull: { pushTokens: token } },
    );
  }

  findPushRecipients(ids: Types.ObjectId[]) {
    return this.userModel
      .find({
        _id: { $in: ids },
        notificationsEnabled: true,
        'pushTokens.0': { $exists: true },
      })
      .select('+pushTokens locale');
  }
}
