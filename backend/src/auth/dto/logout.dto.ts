import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Push token of this device to forget' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pushToken?: string;
}
