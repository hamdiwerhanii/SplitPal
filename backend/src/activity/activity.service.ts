import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from 'src/groups/entities/group.entity';
import type { CursorPage } from 'src/utils/cursor-query.dto';
import {
  Activity,
  ActivityData,
  ActivityDocument,
} from './entities/activity.entity';
import { ActivityType } from './enums/activity-type.enum';

export type RecordActivityInput = {
  group: Types.ObjectId;
  actor: Types.ObjectId | string;
  type: ActivityType;
  data?: Partial<ActivityData>;
};

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  async record(input: RecordActivityInput): Promise<void> {
    try {
      await this.activityModel.create({
        group: input.group,
        actor: new Types.ObjectId(input.actor),
        type: input.type,
        data: input.data ?? {},
      });
    } catch (error) {
      this.logger.error('Failed to record activity', (error as Error).stack);
    }
  }

  async listForUser(
    userId: string,
    limit: number,
    cursor?: string,
    groupId?: string,
  ): Promise<CursorPage<ActivityDocument>> {
    const groupIds = groupId
      ? [new Types.ObjectId(groupId)]
      : (
          await this.groupModel
            .find({ 'members.user': new Types.ObjectId(userId) })
            .select('_id')
            .lean()
        ).map((group) => group._id);

    const items = await this.activityModel
      .find({
        group: { $in: groupIds },
        ...(cursor ? { _id: { $lt: new Types.ObjectId(cursor) } } : {}),
      })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('actor', 'name')
      .populate('group', 'name currency')
      .populate('data.targetUser', 'name');

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id.toString() : null,
    };
  }
}
