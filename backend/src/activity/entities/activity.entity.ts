import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { baseSchemaOptions } from 'src/utils/schema-options.util';
import { ActivityType } from '../enums/activity-type.enum';

@Schema({ _id: false })
export class ActivityData {
  @Prop()
  description?: string;

  @Prop()
  amount?: number;

  @Prop()
  groupName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetUser?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Expense' })
  expense?: Types.ObjectId;
}

export const ActivityDataSchema = SchemaFactory.createForClass(ActivityData);

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({
  ...baseSchemaOptions,
  timestamps: { createdAt: true, updatedAt: false },
})
export class Activity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  group: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  @Prop({ type: String, enum: ActivityType, required: true })
  type: ActivityType;

  @Prop({ type: ActivityDataSchema, default: {} })
  data: ActivityData;

  createdAt: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ group: 1, _id: -1 });
