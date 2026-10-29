import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { RequestOtpDto } from './request-otp.dto';

export class VerifyOtpDto extends RequestOtpDto {
  @ApiProperty({
    example: '482913',
    description: '6-digit code from the email',
  })
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
