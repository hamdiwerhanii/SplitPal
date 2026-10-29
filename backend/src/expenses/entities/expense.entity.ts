import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { baseSchemaOptions } from 'src/utils/schema-options.util';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { SplitType } from '../enums/split-type.enum';

@Schema({ _id: false })
export class ExpenseShare {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;
}

export const ExpenseShareSchema = SchemaFactory.createForClass(ExpenseShare);

@Schema({ _id: false })
export class SplitInput {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Number, default: null })
  value: number | null;
}

export const SplitInputSchema = SchemaFactory.createForClass(SplitInput);

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema(baseSchemaOptions)
export class Expense {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  group: Types.ObjectId;

  @Prop({ required: true })
  clientId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  description: string;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ type: String, enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  paidBy: Types.ObjectId;

  @Prop({ type: String, enum: SplitType, required: true })
  splitType: SplitType;

  @Prop({ type: [SplitInputSchema], default: [] })
  splitInputs: SplitInput[];

  @Prop({ type: [ExpenseShareSchema], default: [] })
  shares: ExpenseShare[];

  @Prop({ required: true })
  date: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ createdBy: 1, clientId: 1 }, { unique: true });
ExpenseSchema.index({ group: 1, date: -1, _id: -1 });
