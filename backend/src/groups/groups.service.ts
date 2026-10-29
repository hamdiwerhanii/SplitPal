import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, Types } from 'mongoose';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityType } from 'src/activity/enums/activity-type.enum';
import { BalancesService } from 'src/balances/balances.service';
import type { Env } from 'src/config/env.validation';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserService } from 'src/user/user.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  activeMemberIds,
  Group,
  GroupDocument,
  isActiveMember,
} from './entities/group.entity';
import { generateInviteCode } from './utils/invite-code.util';

const MAX_CODE_ATTEMPTS = 5;

export type GroupSummary = {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  myBalance: number;
  lastActivityAt: Date;
};

export type GroupDetail = Omit<GroupSummary, 'myBalance'> & {
  inviteCode: string;
  inviteUrl: string;
  createdBy: string;
  createdAt: Date;
  members: {
    id: string;
    name: string;
    email: string;
    joinedAt: Date;
    active: boolean;
  }[];
};

export type InvitePreview = {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  isMember: boolean;
};

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    private readonly balancesService: BalancesService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly userService: UserService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(userId: string, dto: CreateGroupDto): Promise<GroupDetail> {
    const owner = new Types.ObjectId(userId);
    const group = await this.withUniqueInviteCode((inviteCode) =>
      this.groupModel.create({
        name: dto.name,
        currency: dto.currency,
        inviteCode,
        createdBy: owner,
        members: [{ user: owner }],
      }),
    );

    await this.activityService.record({
      group: group._id,
      actor: userId,
      type: ActivityType.GROUP_CREATED,
      data: { groupName: group.name },
    });
    return this.toDetail(group);
  }

  async listForUser(userId: string): Promise<GroupSummary[]> {
    const groups = await this.groupModel
      .find({
        members: {
          $elemMatch: { user: new Types.ObjectId(userId), leftAt: null },
        },
      })
      .sort({ lastActivityAt: -1 });

    const balances = await this.balancesService.netForUser(
      groups.map((group) => group._id),
      userId,
    );

    return groups.map((group) => ({
      id: group._id.toString(),
      name: group.name,
      currency: group.currency,
      memberCount: activeMemberIds(group).length,
      myBalance: balances.get(group._id.toString()) ?? 0,
      lastActivityAt: group.lastActivityAt,
    }));
  }

  async rename(
    userId: string,
    group: GroupDocument,
    dto: UpdateGroupDto,
  ): Promise<GroupDetail> {
    group.name = dto.name;
    await group.save();
    await this.activityService.record({
      group: group._id,
      actor: userId,
      type: ActivityType.GROUP_RENAMED,
      data: { groupName: group.name },
    });
    return this.toDetail(group);
  }

  async previewInvite(
    userId: string,
    inviteCode: string,
  ): Promise<InvitePreview> {
    const group = await this.findByInviteCode(inviteCode);
    return {
      id: group._id.toString(),
      name: group.name,
      currency: group.currency,
      memberCount: activeMemberIds(group).length,
      isMember: isActiveMember(group, userId),
    };
  }

  async join(userId: string, inviteCode: string): Promise<GroupDetail> {
    const group = await this.findByInviteCode(inviteCode);
    if (isActiveMember(group, userId)) {
      return this.toDetail(group);
    }

    const user = new Types.ObjectId(userId);
    const rejoined = await this.groupModel.findOneAndUpdate(
      { _id: group._id, 'members.user': user },
      { $set: { 'members.$.leftAt': null, 'members.$.joinedAt': new Date() } },
      { new: true },
    );
    const updated =
      rejoined ??
      (await this.groupModel.findOneAndUpdate(
        { _id: group._id, 'members.user': { $ne: user } },
        { $push: { members: { user, joinedAt: new Date(), leftAt: null } } },
        { new: true },
      )) ??
      (await this.groupModel.findById(group._id));

    if (!updated) {
      throw new NotFoundException('Group not found');
    }

    await this.activityService.record({
      group: updated._id,
      actor: userId,
      type: ActivityType.MEMBER_JOINED,
      data: { groupName: updated.name },
    });
    const actor = await this.userService.findById(userId);
    this.notificationsService.notifyGroup(updated, userId, {
      kind: 'member.joined',
      actorName: actor.name,
    });
    return this.toDetail(updated);
  }

  async leave(userId: string, group: GroupDocument): Promise<void> {
    const balances = await this.balancesService.netForUser([group._id], userId);
    if ((balances.get(group._id.toString()) ?? 0) !== 0) {
      throw new ConflictException({
        code: 'BALANCE_NOT_SETTLED',
        message: 'Settle up before leaving the group',
      });
    }

    await this.groupModel.updateOne(
      { _id: group._id, 'members.user': new Types.ObjectId(userId) },
      { $set: { 'members.$.leftAt': new Date() } },
    );
    await this.activityService.record({
      group: group._id,
      actor: userId,
      type: ActivityType.MEMBER_LEFT,
      data: { groupName: group.name },
    });
  }

  async regenerateInvite(
    group: GroupDocument,
  ): Promise<Pick<GroupDetail, 'inviteCode' | 'inviteUrl'>> {
    const updated = await this.withUniqueInviteCode(async (inviteCode) => {
      group.inviteCode = inviteCode;
      return group.save();
    });
    return {
      inviteCode: updated.inviteCode,
      inviteUrl: this.inviteUrl(updated.inviteCode),
    };
  }

  async toDetail(group: GroupDocument): Promise<GroupDetail> {
    const users = await this.userService.findByIds(
      group.members.map((member) => member.user),
    );
    const byId = new Map(users.map((user) => [user._id.toString(), user]));

    return {
      id: group._id.toString(),
      name: group.name,
      currency: group.currency,
      memberCount: activeMemberIds(group).length,
      lastActivityAt: group.lastActivityAt,
      inviteCode: group.inviteCode,
      inviteUrl: this.inviteUrl(group.inviteCode),
      createdBy: group.createdBy.toString(),
      createdAt: group.createdAt,
      members: group.members.map((member) => {
        const user = byId.get(member.user.toString());
        return {
          id: member.user.toString(),
          name: user?.name ?? '?',
          email: user?.email ?? '',
          joinedAt: member.joinedAt,
          active: !member.leftAt,
        };
      }),
    };
  }

  private async findByInviteCode(inviteCode: string): Promise<GroupDocument> {
    const group = await this.groupModel.findOne({ inviteCode });
    if (!group) {
      throw new NotFoundException('Invite link is invalid or expired');
    }
    return group;
  }

  private inviteUrl(inviteCode: string): string {
    const base = this.config.get('INVITE_URL_BASE', { infer: true });
    return `${base.replace(/\/+$/, '')}/${inviteCode}`;
  }

  private async withUniqueInviteCode<T>(
    write: (inviteCode: string) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await write(generateInviteCode());
      } catch (error) {
        const duplicate =
          error instanceof mongo.MongoServerError && error.code === 11000;
        if (!duplicate || attempt >= MAX_CODE_ATTEMPTS) {
          throw error;
        }
      }
    }
  }
}
