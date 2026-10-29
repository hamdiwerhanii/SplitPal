import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export const SYNC_OPERATION_TYPES = ['expense.create'] as const;
export type SyncOperationType = (typeof SYNC_OPERATION_TYPES)[number];

export class SyncOperationDto {
  @ApiProperty({ description: 'Idempotency key generated on the device' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ enum: SYNC_OPERATION_TYPES })
  @IsIn(SYNC_OPERATION_TYPES)
  type: SyncOperationType;

  @ApiProperty()
  @IsMongoId()
  groupId: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Same body as POST /groups/:groupId/expenses',
  })
  @IsObject()
  payload: Record<string, unknown>;
}

export class SyncRequestDto {
  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}
