import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SUPPORTED_CURRENCIES } from 'src/utils/currency.util';
import type { CurrencyCode } from 'src/utils/currency.util';
import { baseSchemaOptions } from 'src/utils/schema-options.util';
import { Locale } from '../enums/locale.enum';

export type UserDocument = HydratedDocument<User>;

@Schema(baseSchemaOptions)
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ type: String, enum: Locale, default: Locale.EN })
  locale: Locale;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, default: 'TND' })
  defaultCurrency: CurrencyCode;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop({ type: [String], default: [], select: false })
  pushTokens: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
