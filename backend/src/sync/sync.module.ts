import { Module } from '@nestjs/common';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { GroupAccessModule } from 'src/groups/group-access.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [GroupAccessModule, ExpensesModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
