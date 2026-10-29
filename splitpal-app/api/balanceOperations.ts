import type {
  CreateSettlementRequest,
  GroupBalances,
} from "@/types/balances/BalanceTypes";
import API from "./client";

export const getBalances = async (groupId: string): Promise<GroupBalances> => {
  const { data } = await API.get<GroupBalances>(`/groups/${groupId}/balances`);
  return data;
};

export const createSettlement = async (
  groupId: string,
  body: CreateSettlementRequest,
): Promise<void> => {
  await API.post(`/groups/${groupId}/settlements`, body);
};
