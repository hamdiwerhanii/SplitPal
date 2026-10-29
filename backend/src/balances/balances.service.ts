import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityType } from 'src/activity/enums/activity-type.enum';
import { Expense } from 'src/expenses/entities/expense.entity';
import { GroupDocument } from 'src/groups/entities/group.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserService } from 'src/user/user.service';
import { formatMinorUnits } from 'src/utils/currency.util';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { Settlement, SettlementDocument } from './entities/settlement.entity';
import { settleUp, Transfer } from './utils/settle-up.util';

type Total = {
  _id: { group: Types.ObjectId; user: Types.ObjectId };
  total: number;
};

export type GroupBalances = {
  currency: string;
  balances: { userId: string; net: number }[];
  transfers: Transfer[];
};

const sumBy = (
  groupField: string,
  userField: string,
  amountField: string,
): PipelineStage.Group => ({
  $group: {
    _id: { group: `$${groupField}`, user: `$${userField}` },
    total: { $sum: `$${amountField}` },
  },
});

@Injectable()
export class BalancesService {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Settlement.name)
    private readonly settlementModel: Model<Settlement>,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly userService: UserService,
  ) {}

  async netBalancesByGroup(
    groupIds: Types.ObjectId[],
  ): Promise<Map<string, Map<string, number>>> {
    const match = { $match: { group: { $in: groupIds } } };

    const [paid, owed, sent, received] = await Promise.all([
      this.expenseModel.aggregate<Total>([
        match,
        sumBy('group', 'paidBy', 'amount'),
      ]),
      this.expenseModel.aggregate<Total>([
        match,
        { $unwind: '$shares' },
        sumBy('group', 'shares.user', 'shares.amount'),
      ]),
      this.settlementModel.aggregate<Total>([
        match,
        sumBy('group', 'from', 'amount'),
      ]),
      this.settlementModel.aggregate<Total>([
        match,
        sumBy('group', 'to', 'amount'),
      ]),
    ]);

    const result = new Map<string, Map<string, number>>(
      groupIds.map((id) => [id.toString(), new Map<string, number>()]),
    );
    const apply = (totals: Total[], sign: 1 | -1) => {
      for (const { _id, total } of totals) {
        const balances = result.get(_id.group.toString());
        const userId = _id.user.toString();
        balances?.set(userId, (balances.get(userId) ?? 0) + sign * total);
      }
    };

    apply(paid, 1);
    apply(owed, -1);
    apply(sent, 1);
    apply(received, -1);
    return result;
  }

  async netForUser(
    groupIds: Types.ObjectId[],
    userId: string,
  ): Promise<Map<string, number>> {
    const byGroup = await this.netBalancesByGroup(groupIds);
    return new Map(
      [...byGroup].map(([groupId, balances]) => [
        groupId,
        balances.get(userId) ?? 0,
      ]),
    );
  }

  async getGroupBalances(group: GroupDocument): Promise<GroupBalances> {
    const byGroup = await this.netBalancesByGroup([group._id]);
    const balances =
      byGroup.get(group._id.toString()) ?? new Map<string, number>();

    for (const member of group.members) {
      const id = member.user.toString();
      if (!balances.has(id)) balances.set(id, 0);
    }

    return {
      currency: group.currency,
      balances: [...balances].map(([userId, net]) => ({ userId, net })),
      transfers: settleUp(balances),
    };
  }

  async createSettlement(
    userId: string,
    group: GroupDocument,
    dto: CreateSettlementDto,
  ): Promise<SettlementDocument> {
    const isMember = (id: string) =>
      group.members.some((member) => member.user.toString() === id);

    if (dto.fromUserId === dto.toUserId) {
      throw new BadRequestException('A payment needs two different people');
    }
    if (!isMember(dto.fromUserId) || !isMember(dto.toUserId)) {
      throw new BadRequestException({
        code: 'NOT_A_MEMBER',
        message: 'Both people must belong to this group',
      });
    }

    const settlement = await this.settlementModel.create({
      group: group._id,
      from: new Types.ObjectId(dto.fromUserId),
      to: new Types.ObjectId(dto.toUserId),
      amount: dto.amount,
      createdBy: new Types.ObjectId(userId),
    });

    await this.activityService.record({
      group: group._id,
      actor: dto.fromUserId,
      type: ActivityType.SETTLEMENT_CREATED,
      data: {
        amount: dto.amount,
        groupName: group.name,
        targetUser: new Types.ObjectId(dto.toUserId),
      },
    });

    const [from, to] = await Promise.all([
      this.userService.findById(dto.fromUserId),
      this.userService.findById(dto.toUserId),
    ]);
    this.notificationsService.notifyGroup(group, userId, {
      kind: 'settlement.created',
      actorName: from.name,
      fromName: from.name,
      toName: to.name,
      amount: formatMinorUnits(dto.amount, group.currency),
    });

    return settlement;
  }
}
