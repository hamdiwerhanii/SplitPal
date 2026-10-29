import type { SchemaOptions } from '@nestjs/mongoose';

type JsonRecord = Record<string, unknown> & { _id?: { toString(): string } };

export const toJsonTransform = (_doc: unknown, ret: JsonRecord) => {
  if (ret._id) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
  delete ret.__v;
  return ret;
};

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: { versionKey: false, transform: toJsonTransform },
};
