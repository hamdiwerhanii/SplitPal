import { QueryClient } from "@tanstack/react-query";

let queryClientInstance: QueryClient | undefined;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  queryClientInstance ??= makeQueryClient();
  return queryClientInstance;
}
