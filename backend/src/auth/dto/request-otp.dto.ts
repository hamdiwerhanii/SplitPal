import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Locale } from 'src/user/enums/locale.enum';

export class RequestOtpDto {
  @ApiProperty({ example: 'hamdi@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({ enum: Locale, description: 'Language of the email' })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
