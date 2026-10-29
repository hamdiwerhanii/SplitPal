import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { GroupRequest } from 'src/groups/guards/group-member.guard';
import type { GroupDocument } from 'src/groups/entities/group.entity';

export const CurrentGroup = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GroupDocument =>
    context.switchToHttp().getRequest<GroupRequest>().group,
);
