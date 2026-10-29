import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode } from "react";
import { getQueryClient } from "@/libs/queryClient";

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  }),
);

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "splitpal-query-cache",
  throttleTime: 1000,
});

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={getQueryClient()}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: "v1" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
