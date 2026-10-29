import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { AuthenticatedRequest } from 'src/auth/types/auth.types';
import { Group, GroupDocument, isActiveMember } from '../entities/group.entity';

export type GroupRequest = AuthenticatedRequest & { group: GroupDocument };

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GroupRequest>();
    const groupId = request.params.groupId;

    if (typeof groupId !== 'string' || !isValidObjectId(groupId)) {
      throw new NotFoundException('Group not found');
    }

    const group = await this.groupModel.findById(groupId);
    if (!group || !isActiveMember(group, request.user.sub)) {
      throw new NotFoundException('Group not found');
    }

    request.group = group;
    return true;
  }
}
