import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { baseSchemaOptions } from 'src/utils/schema-options.util';

export type SettlementDocument = HydratedDocument<Settlement>;

@Schema(baseSchemaOptions)
export class Settlement {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true, index: true })
  group: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  from: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  to: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
}

export const SettlementSchema = SchemaFactory.createForClass(Settlement);
