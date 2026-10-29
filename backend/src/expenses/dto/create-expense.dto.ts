import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { SplitType } from '../enums/split-type.enum';
import { MAX_AMOUNT } from '../utils/split.util';

export class ParticipantDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({
    description:
      'Ignored for equal splits. Exact: amount in minor units. Percent: basis points (2500 = 25%).',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_AMOUNT)
  value?: number;
}

export class CreateExpenseDto {
  @ApiPropertyOptional({
    description: 'Client-generated UUID that makes the request idempotent',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ example: 'Dinner' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  description: string;

  @ApiProperty({
    example: 200000,
    description: 'Integer in minor units (200000 = 200.000 TND)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_AMOUNT)
  amount: number;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty()
  @IsMongoId()
  paidBy: string;

  @ApiProperty({ enum: SplitType })
  @IsEnum(SplitType)
  splitType: SplitType;

  @ApiProperty({ type: [ParticipantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];

  @ApiPropertyOptional({ example: '2026-10-28T19:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
