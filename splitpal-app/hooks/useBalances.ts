import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSettlement, getBalances } from "@/api/balanceOperations";
import { invalidateGroupData } from "@/libs/invalidate";
import { queryKeys } from "@/libs/queryKeys";
import type { CreateSettlementRequest } from "@/types/balances/BalanceTypes";

export const useBalances = (groupId: string) =>
  useQuery({
    queryKey: queryKeys.balances(groupId),
    queryFn: () => getBalances(groupId),
    enabled: !!groupId,
  });

export const useSettleUp = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSettlementRequest) => createSettlement(groupId, body),
    onSuccess: () => invalidateGroupData(queryClient, groupId),
  });
};
