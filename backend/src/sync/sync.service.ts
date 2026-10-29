import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model } from 'mongoose';
import { CreateExpenseDto } from 'src/expenses/dto/create-expense.dto';
import { ExpenseDocument } from 'src/expenses/entities/expense.entity';
import { ExpensesService } from 'src/expenses/expenses.service';
import { Group, isActiveMember } from 'src/groups/entities/group.entity';
import { SyncOperationDto } from './dto/sync-request.dto';

export type SyncResult = {
  clientId: string;
  status: 'created' | 'duplicate' | 'rejected';
  expense?: ExpenseDocument;
  error?: { code: string; message: string };
};

const rejected = (
  clientId: string,
  code: string,
  message: string,
): SyncResult => ({
  clientId,
  status: 'rejected',
  error: { code, message },
});

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    private readonly expensesService: ExpensesService,
  ) {}

  async apply(
    userId: string,
    operations: SyncOperationDto[],
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const operation of operations) {
      results.push(await this.applyOne(userId, operation));
    }
    return results;
  }

  private async applyOne(
    userId: string,
    operation: SyncOperationDto,
  ): Promise<SyncResult> {
    const group = await this.groupModel.findById(operation.groupId);
    if (!group || !isActiveMember(group, userId)) {
      return rejected(operation.clientId, 'GROUP_NOT_FOUND', 'Group not found');
    }

    const dto = plainToInstance(CreateExpenseDto, {
      ...operation.payload,
      clientId: operation.clientId,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const message = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .join(', ');
      return rejected(
        operation.clientId,
        'VALIDATION_FAILED',
        message || 'Invalid expense',
      );
    }

    try {
      const { expense, created } = await this.expensesService.create(
        userId,
        group,
        dto,
      );
      return {
        clientId: operation.clientId,
        status: created ? 'created' : 'duplicate',
        expense,
      };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() < 500) {
        const body = error.getResponse() as { code?: string; message?: string };
        return rejected(
          operation.clientId,
          body.code ?? 'REJECTED',
          body.message ?? error.message,
        );
      }
      this.logger.error('Sync operation failed', (error as Error).stack);
      throw error;
    }
  }
}
