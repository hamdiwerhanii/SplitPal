import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { CurrentGroup } from 'src/decorators/current-group.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { GroupDocument } from 'src/groups/entities/group.entity';
import { GroupMemberGuard } from 'src/groups/guards/group-member.guard';
import { CursorQueryDto } from 'src/utils/cursor-query.dto';
import { ActivityService } from './activity.service';

@ApiTags('Activity')
@ApiBearerAuth('access_token')
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('activity')
  @ApiOperation({ summary: 'Timeline of every group I belong to' })
  list(@CurrentUser() user: JwtPayload, @Query() query: CursorQueryDto) {
    return this.activityService.listForUser(
      user.sub,
      query.limit,
      query.cursor,
    );
  }

  @Get('groups/:groupId/activity')
  @UseGuards(GroupMemberGuard)
  @ApiOperation({ summary: 'Timeline of one group' })
  listForGroup(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Query() query: CursorQueryDto,
  ) {
    return this.activityService.listForUser(
      user.sub,
      query.limit,
      query.cursor,
      group._id.toString(),
    );
  }
}
