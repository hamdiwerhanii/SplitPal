import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SUPPORTED_CURRENCIES } from 'src/utils/currency.util';
import type { CurrencyCode } from 'src/utils/currency.util';
import { baseSchemaOptions } from 'src/utils/schema-options.util';

@Schema({ _id: false })
export class GroupMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ default: () => new Date() })
  joinedAt: Date;

  @Prop({ type: Date, default: null })
  leftAt: Date | null;
}

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);

export type GroupDocument = HydratedDocument<Group>;

@Schema(baseSchemaOptions)
export class Group {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, required: true })
  currency: CurrencyCode;

  @Prop({ required: true })
  inviteCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [GroupMemberSchema], default: [] })
  members: GroupMember[];

  @Prop({ default: () => new Date() })
  lastActivityAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ inviteCode: 1 }, { unique: true });
GroupSchema.index({ 'members.user': 1, lastActivityAt: -1 });

export const activeMemberIds = (group: Group): Types.ObjectId[] =>
  group.members.filter((m) => !m.leftAt).map((m) => m.user);

export const isActiveMember = (group: Group, userId: string): boolean =>
  group.members.some((m) => !m.leftAt && m.user.toString() === userId);
