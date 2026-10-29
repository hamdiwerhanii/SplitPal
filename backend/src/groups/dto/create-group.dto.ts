import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { SUPPORTED_CURRENCIES } from 'src/utils/currency.util';
import type { CurrencyCode } from 'src/utils/currency.util';

export class CreateGroupDto {
  @ApiProperty({ example: 'Tozeur Trip' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiProperty({ enum: SUPPORTED_CURRENCIES, example: 'TND' })
  @IsIn(SUPPORTED_CURRENCIES)
  currency: CurrencyCode;
}
