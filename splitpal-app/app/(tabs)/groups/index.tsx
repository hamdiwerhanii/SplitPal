import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import BalanceSummary from "@/components/groups/BalanceSummary";
import GroupCard from "@/components/groups/GroupCard";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import OfflineBanner from "@/components/ui/OfflineBanner";
import Screen from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useThemeColors } from "@/constants/theme";
import { useGroups } from "@/hooks/useGroups";
import { useOutboxStatus } from "@/hooks/useOutboxSync";

export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { data: groups, isPending, isError, refetch, isRefetching } = useGroups();
  const { flush, pendingCount } = useOutboxStatus();
  const hasGroups = !!groups && groups.length > 0;

  return (
    <Screen
      title={t("groups.title")}
      right={
        hasGroups ? (
          <View className="flex-row gap-2">
            <IconButton
              icon="enter-outline"
              label={t("groups.join")}
              onPress={() => router.push("/groups/join")}
            />
            <IconButton
              icon="add"
              tone="primary"
              label={t("groups.create")}
              onPress={() => router.push("/groups/create")}
            />
          </View>
        ) : null
      }
    >
      <OfflineBanner pendingCount={pendingCount} onSync={() => void flush()} />
      {isPending ? (
        <SkeletonList withHero />
      ) : isError && !groups ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(group) => group.id}
          renderItem={({ item, index }) => <GroupCard group={item} index={index} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-4 pb-8"
          ListHeaderComponent={hasGroups ? <BalanceSummary groups={groups} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              emoji="🧳"
              title={t("groups.emptyTitle")}
              subtitle={t("groups.emptySubtitle")}
              action={
                <View className="gap-3">
                  <Button
                    testID="create-group"
                    label={t("groups.create")}
                    fullWidth
                    leftIcon={<Ionicons name="add" size={20} color={colors.onPrimary} />}
                    onPress={() => router.push("/groups/create")}
                  />
                  <Button
                    testID="join-group"
                    label={t("groups.join")}
                    variant="outline"
                    fullWidth
                    onPress={() => router.push("/groups/join")}
                  />
                </View>
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </Screen>
  );
}
