import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import BalanceRow from "@/components/balances/BalanceRow";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useThemeColors } from "@/constants/theme";
import { useBalances } from "@/hooks/useBalances";
import { useGroup } from "@/hooks/useGroups";
import useAuthStore from "@/stores/authStore";

export default function BalancesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const group = useGroup(groupId);
  const balances = useBalances(groupId);

  const nameOf = (id: string) =>
    id === userId ? t("common.you") : (group.data?.members.find((m) => m.id === id)?.name ?? "?");

  const rows = [...(balances.data?.balances ?? [])].sort((a, b) => b.net - a.net);
  const allSettled = rows.every((row) => row.net === 0);

  return (
    <Screen title={t("balances.title")} showBack>
      {balances.isPending || group.isPending ? (
        <LoadingState />
      ) : !balances.data ? (
        <ErrorState onRetry={() => void balances.refetch()} />
      ) : (
        <ScrollView
          contentContainerClassName="px-4 pb-10 gap-4"
          refreshControl={
            <RefreshControl
              refreshing={balances.isRefetching}
              onRefresh={() => void balances.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View className="rounded-2xl bg-surface border border-border">
            {rows.map((row, index) => (
              <View key={row.userId} className={index > 0 ? "border-t border-border" : ""}>
                <BalanceRow
                  userId={row.userId}
                  name={nameOf(row.userId)}
                  net={row.net}
                  currency={balances.data.currency}
                />
              </View>
            ))}
          </View>
          {allSettled ? (
            <Text className="text-center text-base text-muted">{t("balances.allSettled")}</Text>
          ) : (
            <Button
              label={t("group.settleUp")}
              fullWidth
              size="lg"
              onPress={() =>
                router.push({ pathname: "/groups/[groupId]/settle-up", params: { groupId } })
              }
            />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
