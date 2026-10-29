import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizeInviteCode } from '../utils/invite-code.util';

export class JoinGroupDto {
  @ApiProperty({ example: 'K7PX2M9Q' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeInviteCode(value) : value,
  )
  @Matches(/^[A-Z2-9]{8}$/, { message: 'invalid invite code' })
  inviteCode: string;
}
