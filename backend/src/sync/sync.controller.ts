import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth('access_token')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Replay the offline outbox; safe to send the same operation twice',
  })
  @ApiResponse({
    status: 200,
    description: 'One result per operation: created, duplicate or rejected',
  })
  async sync(@CurrentUser() user: JwtPayload, @Body() dto: SyncRequestDto) {
    return { results: await this.syncService.apply(user.sub, dto.operations) };
  }
}
