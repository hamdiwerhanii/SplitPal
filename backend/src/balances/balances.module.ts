import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from 'src/activity/activity.module';
import { Expense, ExpenseSchema } from 'src/expenses/entities/expense.entity';
import { GroupAccessModule } from 'src/groups/group-access.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserModule } from 'src/user/user.module';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';
import { Settlement, SettlementSchema } from './entities/settlement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Settlement.name, schema: SettlementSchema },
    ]),
    GroupAccessModule,
    ActivityModule,
    NotificationsModule,
    UserModule,
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService],
})
export class BalancesModule {}
