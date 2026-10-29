import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OutboxItem, SyncOperation } from "@/types/sync/SyncTypes";

type OutboxState = {
  items: OutboxItem[];
  enqueue: (operation: SyncOperation) => void;
  remove: (clientIds: string[]) => void;
  markFailed: (failures: { clientId: string; error: string }[]) => void;
  clear: () => void;
};

const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (operation) =>
        set((state) =>
          state.items.some((item) => item.clientId === operation.clientId)
            ? state
            : {
                items: [
                  ...state.items,
                  { ...operation, queuedAt: new Date().toISOString(), status: "pending" },
                ],
              },
        ),
      remove: (clientIds) =>
        set((state) => ({
          items: state.items.filter((item) => !clientIds.includes(item.clientId)),
        })),
      markFailed: (failures) =>
        set((state) => ({
          items: state.items.map((item) => {
            const failure = failures.find((f) => f.clientId === item.clientId);
            return failure ? { ...item, status: "failed", error: failure.error } : item;
          }),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "outbox-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const selectPendingItems = (state: OutboxState) =>
  state.items.filter((item) => item.status === "pending");

export default useOutboxStore;
