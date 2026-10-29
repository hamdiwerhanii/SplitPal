import type { SyncOperation, SyncResult } from "@/types/sync/SyncTypes";
import API from "./client";

export const syncOperations = async (
  operations: SyncOperation[],
): Promise<SyncResult[]> => {
  const { data } = await API.post<{ results: SyncResult[] }>("/sync", {
    operations,
  });
  return data.results;
};
