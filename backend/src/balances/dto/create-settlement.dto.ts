import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';
import { MAX_AMOUNT } from 'src/expenses/utils/split.util';

export class CreateSettlementDto {
  @ApiProperty({ description: 'Who paid' })
  @IsMongoId()
  fromUserId: string;

  @ApiProperty({ description: 'Who received the money' })
  @IsMongoId()
  toUserId: string;

  @ApiProperty({ example: 230000, description: 'Integer in minor units' })
  @IsInt()
  @Min(1)
  @Max(MAX_AMOUNT)
  amount: number;
}
