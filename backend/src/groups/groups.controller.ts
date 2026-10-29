import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { CurrentGroup } from 'src/decorators/current-group.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import type { GroupDocument } from './entities/group.entity';
import { GroupsService } from './groups.service';
import { GroupMemberGuard } from './guards/group-member.guard';

@ApiTags('Groups')
@ApiBearerAuth('access_token')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'My groups with my balance in each' })
  list(@CurrentUser() user: JwtPayload) {
    return this.groupsService.listForUser(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a group' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.sub, dto);
  }

  @Get('invites/:inviteCode')
  @ApiOperation({ summary: 'Preview the group behind an invite code' })
  @ApiResponse({ status: 404, description: 'Unknown invite code' })
  previewInvite(
    @CurrentUser() user: JwtPayload,
    @Param() params: JoinGroupDto,
  ) {
    return this.groupsService.previewInvite(user.sub, params.inviteCode);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a group with an invite code' })
  join(@CurrentUser() user: JwtPayload, @Body() dto: JoinGroupDto) {
    return this.groupsService.join(user.sub, dto.inviteCode);
  }

  @Get(':groupId')
  @UseGuards(GroupMemberGuard)
  @ApiOperation({ summary: 'Group detail with members and invite link' })
  findOne(@CurrentGroup() group: GroupDocument) {
    return this.groupsService.toDetail(group);
  }

  @Patch(':groupId')
  @UseGuards(GroupMemberGuard)
  @ApiOperation({ summary: 'Rename a group' })
  rename(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.rename(user.sub, group, dto);
  }

  @Post(':groupId/leave')
  @UseGuards(GroupMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a group (only when settled up)' })
  @ApiResponse({ status: 409, description: 'Balance is not zero' })
  leave(@CurrentUser() user: JwtPayload, @CurrentGroup() group: GroupDocument) {
    return this.groupsService.leave(user.sub, group);
  }

  @Post(':groupId/invite/regenerate')
  @UseGuards(GroupMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidate the old invite link and create a new one',
  })
  regenerateInvite(@CurrentGroup() group: GroupDocument) {
    return this.groupsService.regenerateInvite(group);
  }
}
