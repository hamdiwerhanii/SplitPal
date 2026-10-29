import { Module } from '@nestjs/common';
import { ActivityModule } from 'src/activity/activity.module';
import { BalancesModule } from 'src/balances/balances.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserModule } from 'src/user/user.module';
import { GroupAccessModule } from './group-access.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    GroupAccessModule,
    BalancesModule,
    ActivityModule,
    NotificationsModule,
    UserModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
