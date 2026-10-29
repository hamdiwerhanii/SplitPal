import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { JwtPayload } from 'src/auth/types/auth.types';
import { CurrentGroup } from 'src/decorators/current-group.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { GroupDocument } from 'src/groups/entities/group.entity';
import { GroupMemberGuard } from 'src/groups/guards/group-member.guard';
import { CursorQueryDto } from 'src/utils/cursor-query.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth('access_token')
@UseGuards(GroupMemberGuard)
@Controller('groups/:groupId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses, newest first' })
  list(@CurrentGroup() group: GroupDocument, @Query() query: CursorQueryDto) {
    return this.expensesService.list(group, query.limit, query.cursor);
  }

  @Post()
  @ApiOperation({ summary: 'Add an expense (idempotent on clientId)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({
    status: 200,
    description: 'Already created with this clientId',
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Body() dto: CreateExpenseDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { expense, created } = await this.expensesService.create(
      user.sub,
      group,
      dto,
    );
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return expense;
  }

  @Get(':expenseId')
  @ApiOperation({ summary: 'Get one expense' })
  findOne(
    @CurrentGroup() group: GroupDocument,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.findOne(group, expenseId);
  }

  @Patch(':expenseId')
  @ApiOperation({ summary: 'Edit an expense' })
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.sub, group, expenseId, dto);
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentGroup() group: GroupDocument,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.remove(user.sub, group, expenseId);
  }
}
