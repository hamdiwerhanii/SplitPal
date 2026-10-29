import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OtpCodeDocument = HydratedDocument<OtpCode>;

@Schema({ timestamps: true })
export class OtpCode {
  _id: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: Date, default: null })
  consumedAt: Date | null;

  createdAt: Date;
}

export const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);
OtpCodeSchema.index({ email: 1, createdAt: -1 });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
