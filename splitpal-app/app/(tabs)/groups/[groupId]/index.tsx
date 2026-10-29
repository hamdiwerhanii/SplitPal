import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Share,
  Text,
  View,
} from "react-native";
import ExpenseRow from "@/components/expenses/ExpenseRow";
import GradientCard from "@/components/ui/GradientCard";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonList } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import OfflineBanner from "@/components/ui/OfflineBanner";
import Screen from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useThemeColors } from "@/constants/theme";
import { useBalances } from "@/hooks/useBalances";
import { useExpenseList } from "@/hooks/useExpenses";
import { useGroup } from "@/hooks/useGroups";
import { useMoney } from "@/hooks/useMoney";
import { useOutboxStatus } from "@/hooks/useOutboxSync";
import useAuthStore from "@/stores/authStore";
import useOutboxStore from "@/stores/outboxStore";

type ActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
};

function QuickAction({ icon, label, onPress, testID }: ActionProps) {
  const colors = useThemeColors();
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      haptic
      className="flex-1 items-center gap-1.5 py-3.5 rounded-2xl bg-surface border border-border"
      style={{ boxShadow: "0 6px 18px -12px rgba(15, 23, 42, 0.2)" }}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
        {label}
      </Text>
    </PressableScale>
  );
}

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const removeFromOutbox = useOutboxStore((state) => state.remove);
  const { flush, pendingCount } = useOutboxStatus();
  const format = useMoney();

  const group = useGroup(groupId);
  const balances = useBalances(groupId);
  const expenses = useExpenseList(groupId);

  if (group.isPending) {
    return (
      <Screen showBack>
        <SkeletonList withHero />
      </Screen>
    );
  }
  if (!group.data) {
    return (
      <Screen showBack>
        <ErrorState onRetry={() => void group.refetch()} />
      </Screen>
    );
  }

  const { data } = group;
  const names = Object.fromEntries(data.members.map((m) => [m.id, m.name]));
  const myNet = balances.data?.balances.find((b) => b.userId === userId)?.net ?? 0;

  const shareInvite = () =>
    void Share.share({
      message: t("group.inviteMessage", {
        name: data.name,
        url: data.inviteUrl,
        code: data.inviteCode,
      }),
    });

  const refresh = () => {
    void group.refetch();
    void balances.refetch();
    void expenses.refetch();
  };

  return (
    <Screen
      title={data.name}
      showBack
      right={
        <IconButton
          icon="ellipsis-horizontal"
          label={t("group.manage")}
          onPress={() =>
            router.push({ pathname: "/groups/[groupId]/settings", params: { groupId } })
          }
        />
      }
    >
      <OfflineBanner pendingCount={pendingCount} onSync={() => void flush()} />
      <FlatList
        data={expenses.items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-28"
        ListHeaderComponent={
          <View className="px-4 gap-4 mb-4">
            <GradientCard tone={myNet < 0 ? "negative" : "primary"}>
              <Text className="text-sm font-medium text-white/80">
                {myNet > 0
                  ? t("groups.youAreOwed")
                  : myNet < 0
                    ? t("groups.youOwe")
                    : t("groups.settled")}
              </Text>
              <Text className="mt-1 text-4xl font-extrabold text-white">
                {format(Math.abs(myNet), data.currency)}
              </Text>
              <Text className="mt-2 text-xs text-white/70">
                {t("groups.members", { count: data.memberCount })} · {data.currency}
              </Text>
            </GradientCard>
            <View className="flex-row gap-3">
              <QuickAction
                testID="open-balances"
                icon="stats-chart-outline"
                label={t("group.balances")}
                onPress={() =>
                  router.push({ pathname: "/groups/[groupId]/balances", params: { groupId } })
                }
              />
              <QuickAction
                testID="open-settle-up"
                icon="swap-horizontal-outline"
                label={t("group.settleUp")}
                onPress={() =>
                  router.push({ pathname: "/groups/[groupId]/settle-up", params: { groupId } })
                }
              />
              <QuickAction icon="person-add-outline" label={t("group.invite")} onPress={shareInvite} />
            </View>
            <Text className="text-lg font-bold text-foreground mt-2">{t("group.expenses")}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ExpenseRow
            index={index}
            expense={item}
            currency={data.currency}
            currentUserId={userId}
            payerName={item.paidBy === userId ? t("common.you") : (names[item.paidBy] ?? "?")}
            onPress={() =>
              router.push({
                pathname: "/groups/[groupId]/expenses/[expenseId]",
                params: { groupId, expenseId: item.id },
              })
            }
            onDiscard={() => removeFromOutbox([item.clientId])}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border ms-[72px]" />}
        ListEmptyComponent={
          expenses.isPending ? (
            <LoadingState />
          ) : expenses.isError ? (
            <ErrorState onRetry={() => void expenses.refetch()} />
          ) : (
            <EmptyState emoji="🧾" title={t("group.emptyTitle")} subtitle={t("group.emptySubtitle")} />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (expenses.hasNextPage && !expenses.isFetchingNextPage) {
            void expenses.fetchNextPage();
          }
        }}
        ListFooterComponent={
          expenses.isFetchingNextPage ? <ActivityIndicator color={colors.primary} className="py-4" /> : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={expenses.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      />
      <View className="absolute bottom-6 left-4 right-4">
        <Button
          testID="add-expense"
          label={t("group.addExpense")}
          size="lg"
          fullWidth
          leftIcon={<Ionicons name="add" size={22} color={colors.onPrimary} />}
          onPress={() =>
            router.push({ pathname: "/groups/[groupId]/add-expense", params: { groupId } })
          }
        />
      </View>
    </Screen>
  );
}
