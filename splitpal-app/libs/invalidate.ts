import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export const invalidateGroupData = (
  queryClient: QueryClient,
  groupId?: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activity }),
    ...(groupId
      ? [
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(groupId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) }),
        ]
      : []),
  ]);
