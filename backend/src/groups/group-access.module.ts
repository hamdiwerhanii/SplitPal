import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './entities/group.entity';
import { GroupMemberGuard } from './guards/group-member.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  providers: [GroupMemberGuard],
  exports: [MongooseModule, GroupMemberGuard],
})
export class GroupAccessModule {}
