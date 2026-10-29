import type { CurrencyCode } from "@/types/common/CommonTypes";
export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type GroupBalances = {
  currency: CurrencyCode;
  balances: { userId: string; net: number }[];
  transfers: Transfer[];
};

export type CreateSettlementRequest = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};
