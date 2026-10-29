import NetInfo from "@react-native-community/netinfo";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useMemo } from "react";
import { isNetworkError } from "@/api/errors";
import {
  createExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
} from "@/api/expenseOperations";
import { invalidateGroupData } from "@/libs/invalidate";
import { queryKeys } from "@/libs/queryKeys";
import useAuthStore from "@/stores/authStore";
import useOutboxStore from "@/stores/outboxStore";
import type {
  AddExpenseResult,
  CreateExpenseRequest,
  Expense,
  ExpenseListItem,
  ExpensePayload,
  UpdateExpenseRequest,
} from "@/types/expenses/ExpenseTypes";
import { outboxToListItem } from "@/utils/helper";

export const useExpenses = (groupId: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.expenses.list(groupId),
    queryFn: ({ pageParam }) => getExpenses(groupId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!groupId,
  });

export const useExpenseList = (groupId: string) => {
  const query = useExpenses(groupId);
  const outbox = useOutboxStore((state) => state.items);
  const userId = useAuthStore((state) => state.user?.id ?? "");

  const items = useMemo<ExpenseListItem[]>(() => {
    const synced = query.data?.pages.flatMap((page) => page.data) ?? [];
    const syncedClientIds = new Set(synced.map((e) => e.clientId));
    const pending = outbox
      .filter((item) => item.groupId === groupId && !syncedClientIds.has(item.clientId))
      .map((item) => outboxToListItem(item, userId))
      .reverse();
    return [...pending, ...synced];
  }, [query.data, outbox, groupId, userId]);

  return { ...query, items };
};

export const useExpense = (groupId: string, expenseId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.expenses.detail(groupId, expenseId),
    queryFn: () => getExpense(groupId, expenseId),
    enabled: !!groupId && !!expenseId,
    initialData: () =>
      queryClient
        .getQueryData<{ pages: { data: Expense[] }[] }>(queryKeys.expenses.list(groupId))
        ?.pages.flatMap((page) => page.data)
        .find((expense) => expense.id === expenseId),
  });
};


export const useAddExpense = (groupId: string) => {
  const queryClient = useQueryClient();
  const enqueue = useOutboxStore((state) => state.enqueue);

  return useMutation({
    networkMode: "always",
    mutationFn: async (
      payload: ExpensePayload,
    ): Promise<AddExpenseResult> => {
      const body: CreateExpenseRequest = {
        ...payload,
        clientId: Crypto.randomUUID(),
        date: new Date().toISOString(),
      };
      const queue = () => {
        const { clientId, ...rest } = body;
        enqueue({ clientId, groupId, type: "expense.create", payload: rest });
        return { queued: true };
      };

      const network = await NetInfo.fetch();
      if (network.isConnected === false) {
        return queue();
      }

      try {
        return { queued: false, expense: await createExpense(groupId, body) };
      } catch (error) {
        if (isNetworkError(error)) {
          return queue();
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      if (!result.queued) {
        void invalidateGroupData(queryClient, groupId);
      }
    },
  });
};

export const useUpdateExpense = (groupId: string, expenseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateExpenseRequest) =>
      updateExpense(groupId, expenseId, body),
    onSuccess: (expense) => {
      queryClient.setQueryData(queryKeys.expenses.detail(groupId, expenseId), expense);
      void invalidateGroupData(queryClient, groupId);
    },
  });
};

export const useDeleteExpense = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(groupId, expenseId),
    onSuccess: (_result, expenseId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.expenses.detail(groupId, expenseId),
      });
      void invalidateGroupData(queryClient, groupId);
    },
  });
};
