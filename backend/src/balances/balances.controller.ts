import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { CurrentGroup } from 'src/decorators/current-group.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { GroupDocument } from 'src/groups/entities/group.entity';
import { GroupMemberGuard } from 'src/groups/guards/group-member.guard';
import { BalancesService } from './balances.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';

@ApiTags('Balances')
@ApiBearerAuth('access_token')
@UseGuards(GroupMemberGuard)
@Controller('groups/:groupId')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('balances')
  @ApiOperation({
    summary: 'Net balance per member and the minimal payments to settle up',
  })
  getBalances(@CurrentGroup() group: GroupDocument) {
    return this.balancesService.getGroupBalances(group);
  }

  @Post('settlements')
  @ApiOperation({ summary: 'Mark a payment between two members as paid' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  createSettlement(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Body() dto: CreateSettlementDto,
  ) {
    return this.balancesService.createSettlement(user.sub, group, dto);
  }
}
