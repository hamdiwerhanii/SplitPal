import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { isValidObjectId, Model, mongo, Types } from 'mongoose';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityType } from 'src/activity/enums/activity-type.enum';
import {
  Group,
  GroupDocument,
  isActiveMember,
} from 'src/groups/entities/group.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserService } from 'src/user/user.service';
import { formatMinorUnits } from 'src/utils/currency.util';
import type { CursorPage } from 'src/utils/cursor-query.dto';
import { CreateExpenseDto, ParticipantDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, ExpenseDocument } from './entities/expense.entity';
import { SplitType } from './enums/split-type.enum';
import { computeShares, SplitError } from './utils/split.util';

export type CreateExpenseResult = {
  expense: ExpenseDocument;
  created: boolean;
};

type SplitFields = {
  amount: number;
  paidBy: string;
  splitType: SplitType;
  participants: ParticipantDto[];
};

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly userService: UserService,
  ) {}

  async create(
    userId: string,
    group: GroupDocument,
    dto: CreateExpenseDto,
  ): Promise<CreateExpenseResult> {
    const clientId = dto.clientId ?? randomUUID();
    const existing = await this.findByClientId(userId, clientId);
    if (existing) {
      return { expense: existing, created: false };
    }

    const split = this.buildSplit(group, dto);

    let expense: ExpenseDocument;
    try {
      expense = await this.expenseModel.create({
        group: group._id,
        clientId,
        createdBy: new Types.ObjectId(userId),
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : new Date(),
        ...split,
      });
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        const duplicate = await this.findByClientId(userId, clientId);
        if (duplicate) {
          return { expense: duplicate, created: false };
        }
      }
      throw error;
    }

    await this.afterChange(
      userId,
      group,
      expense,
      ActivityType.EXPENSE_CREATED,
    );
    return { expense, created: true };
  }

  async list(
    group: GroupDocument,
    limit: number,
    cursor?: string,
  ): Promise<CursorPage<ExpenseDocument>> {
    const filter: Record<string, unknown> = { group: group._id };

    if (cursor) {
      const last = await this.expenseModel
        .findOne({ _id: cursor, group: group._id })
        .select('date')
        .lean();
      if (last) {
        filter.$or = [
          { date: { $lt: last.date } },
          { date: last.date, _id: { $lt: last._id } },
        ];
      }
    }

    const items = await this.expenseModel
      .find(filter)
      .sort({ date: -1, _id: -1 })
      .limit(limit + 1);

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id.toString() : null,
    };
  }

  async findOne(
    group: GroupDocument,
    expenseId: string,
  ): Promise<ExpenseDocument> {
    const expense = isValidObjectId(expenseId)
      ? await this.expenseModel.findOne({ _id: expenseId, group: group._id })
      : null;
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async update(
    userId: string,
    group: GroupDocument,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDocument> {
    const expense = await this.findOne(group, expenseId);

    const splitChanged =
      dto.amount !== undefined ||
      dto.paidBy !== undefined ||
      dto.splitType !== undefined ||
      dto.participants !== undefined;

    if (splitChanged) {
      const split = this.buildSplit(group, {
        amount: dto.amount ?? expense.amount,
        paidBy: dto.paidBy ?? expense.paidBy.toString(),
        splitType: dto.splitType ?? expense.splitType,
        participants:
          dto.participants ??
          expense.splitInputs.map((input) => ({
            userId: input.user.toString(),
            value: input.value ?? undefined,
          })),
      });
      expense.set({ amount: dto.amount ?? expense.amount, ...split });
    }

    if (dto.description !== undefined) expense.description = dto.description;
    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.date !== undefined) expense.date = new Date(dto.date);

    await expense.save();
    await this.afterChange(
      userId,
      group,
      expense,
      ActivityType.EXPENSE_UPDATED,
    );
    return expense;
  }

  async remove(
    userId: string,
    group: GroupDocument,
    expenseId: string,
  ): Promise<void> {
    const expense = await this.findOne(group, expenseId);
    await expense.deleteOne();
    await this.afterChange(
      userId,
      group,
      expense,
      ActivityType.EXPENSE_DELETED,
    );
  }

  private buildSplit(group: GroupDocument, fields: SplitFields) {
    const memberIds = [
      fields.paidBy,
      ...fields.participants.map((p) => p.userId),
    ];
    const outsider = memberIds.find((id) => !isActiveMember(group, id));
    if (outsider) {
      throw new BadRequestException({
        code: 'NOT_A_MEMBER',
        message: `${outsider} is not a member of this group`,
      });
    }

    try {
      const shares = computeShares(
        fields.amount,
        fields.splitType,
        fields.participants,
      );
      return {
        paidBy: new Types.ObjectId(fields.paidBy),
        splitType: fields.splitType,
        splitInputs: fields.participants.map((p) => ({
          user: new Types.ObjectId(p.userId),
          value:
            fields.splitType === SplitType.EQUAL ? null : (p.value ?? null),
        })),
        shares: shares.map((share) => ({
          user: new Types.ObjectId(share.userId),
          amount: share.amount,
        })),
      };
    } catch (error) {
      if (error instanceof SplitError) {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }

  private findByClientId(userId: string, clientId: string) {
    return this.expenseModel.findOne({
      createdBy: new Types.ObjectId(userId),
      clientId,
    });
  }

  private async afterChange(
    userId: string,
    group: GroupDocument,
    expense: ExpenseDocument,
    type: ActivityType,
  ): Promise<void> {
    await this.groupModel.updateOne(
      { _id: group._id },
      { $set: { lastActivityAt: new Date() } },
    );
    await this.activityService.record({
      group: group._id,
      actor: userId,
      type,
      data: {
        description: expense.description,
        amount: expense.amount,
        groupName: group.name,
        expense:
          type === ActivityType.EXPENSE_DELETED ? undefined : expense._id,
      },
    });

    if (type === ActivityType.EXPENSE_DELETED) {
      return;
    }

    const actor = await this.userService.findById(userId);
    this.notificationsService.notifyGroup(
      group,
      userId,
      {
        kind:
          type === ActivityType.EXPENSE_CREATED
            ? 'expense.created'
            : 'expense.updated',
        actorName: actor.name,
        description: expense.description,
        amount: formatMinorUnits(expense.amount, group.currency),
      },
      { expenseId: expense._id.toString() },
    );
  }
}
