import { useInfiniteQuery } from "@tanstack/react-query";
import { getActivity } from "@/api/activityOperations";
import { queryKeys } from "@/libs/queryKeys";

export const useActivity = () =>
  useInfiniteQuery({
    queryKey: queryKeys.activity,
    queryFn: ({ pageParam }) => getActivity(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
