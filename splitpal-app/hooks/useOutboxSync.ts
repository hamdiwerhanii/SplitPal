import NetInfo from "@react-native-community/netinfo";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { isNetworkError } from "@/api/errors";
import { syncOperations } from "@/api/syncOperations";
import { invalidateGroupData } from "@/libs/invalidate";
import useAuthStore from "@/stores/authStore";
import useOutboxStore, { selectPendingItems } from "@/stores/outboxStore";
import { OUTBOX_BATCH_SIZE } from "@/constants/options";
import { partitionSyncResults } from "@/utils/helper";

let syncInFlight: Promise<void> | null = null;

const runSync = async (queryClient: QueryClient) => {
  while (useAuthStore.getState().isAuthenticated) {
    const batch = selectPendingItems(useOutboxStore.getState()).slice(0, OUTBOX_BATCH_SIZE);
    if (batch.length === 0) return;

    const results = await syncOperations(
      batch.map(({ clientId, type, groupId, payload }) => ({
        clientId,
        type,
        groupId,
        payload,
      })),
    );
    const { done, failed } = partitionSyncResults(results);
    const store = useOutboxStore.getState();
    store.remove(done);
    store.markFailed(failed);

    const groupIds = new Set(batch.map((item) => item.groupId));
    await Promise.all(
      [...groupIds].map((groupId) => invalidateGroupData(queryClient, groupId)),
    );
  }
};

export const flushOutbox = (queryClient: QueryClient): Promise<void> => {
  syncInFlight ??= runSync(queryClient)
    .catch((error: unknown) => {
      if (!isNetworkError(error)) {
        console.warn("[outbox] sync failed", error);
      }
    })
    .finally(() => {
      syncInFlight = null;
    });
  return syncInFlight;
};

export const useOutboxStatus = () => {
  const queryClient = useQueryClient();
  const pendingCount = useOutboxStore((state) => selectPendingItems(state).length);
  const flush = useCallback(() => flushOutbox(queryClient), [queryClient]);
  return { pendingCount, flush };
};

export const useOutboxSync = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pendingCount = useOutboxStore((state) => selectPendingItems(state).length);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) void flushOutbox(queryClient);
    });
    const appState = AppState.addEventListener("change", (status) => {
      if (status === "active") void flushOutbox(queryClient);
    });
    return () => {
      unsubscribeNet();
      appState.remove();
    };
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (!isAuthenticated || pendingCount === 0) return;
    void NetInfo.fetch().then((state) => {
      if (state.isConnected) void flushOutbox(queryClient);
    });
  }, [isAuthenticated, pendingCount, queryClient]);
};
