import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import ActivityItem from "@/components/activity/ActivityItem";
import Screen from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useThemeColors } from "@/constants/theme";
import { useActivity } from "@/hooks/useActivity";
import useAuthStore from "@/stores/authStore";

export default function ActivityScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const activity = useActivity();
  const items = activity.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <Screen title={t("activity.title")}>
      {activity.isPending ? (
        <SkeletonList rows={7} />
      ) : activity.isError && items.length === 0 ? (
        <ErrorState onRetry={() => void activity.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ActivityItem activity={item} currentUserId={userId} index={index} />
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-border ms-[66px]" />}
          ListEmptyComponent={
            <EmptyState
              emoji="🕰️"
              title={t("activity.emptyTitle")}
              subtitle={t("activity.emptySubtitle")}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (activity.hasNextPage && !activity.isFetchingNextPage) {
              void activity.fetchNextPage();
            }
          }}
          ListFooterComponent={
            activity.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} className="py-4" />
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={activity.isRefetching}
              onRefresh={() => void activity.refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </Screen>
  );
}
