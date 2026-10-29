import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { isNetworkError } from "@/api/errors";
import TransferCard from "@/components/balances/TransferCard";
import Screen from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import { useThemeColors } from "@/constants/theme";
import { useBalances, useSettleUp } from "@/hooks/useBalances";
import { useGroup } from "@/hooks/useGroups";
import { useMoney } from "@/hooks/useMoney";
import useAuthStore from "@/stores/authStore";
import type { Transfer } from "@/types/balances/BalanceTypes";

export default function SettleUpScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const format = useMoney();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const group = useGroup(groupId);
  const balances = useBalances(groupId);
  const settle = useSettleUp(groupId);

  const nameOf = (id: string) =>
    id === userId ? t("common.you") : (group.data?.members.find((m) => m.id === id)?.name ?? "?");

  const markPaid = (transfer: Transfer) => {
    if (!balances.data) return;
    const amount = format(transfer.amount, balances.data.currency);
    Alert.alert(
      t("settle.confirmTitle"),
      t("settle.confirmMessage", { from: nameOf(transfer.from), to: nameOf(transfer.to), amount }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settle.markPaid"),
          onPress: () =>
            settle.mutate(
              { fromUserId: transfer.from, toUserId: transfer.to, amount: transfer.amount },
              {
                onSuccess: () => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Toast.show({ type: "success", text1: t("settle.recorded") });
                },
                onError: (error) =>
                  Toast.show({
                    type: "error",
                    text1: isNetworkError(error)
                      ? t("common.networkError")
                      : t("common.somethingWrong"),
                  }),
              },
            ),
        },
      ],
    );
  };

  const transfers = balances.data?.transfers ?? [];

  return (
    <Screen title={t("settle.title")} showBack>
      {balances.isPending || group.isPending ? (
        <LoadingState />
      ) : !balances.data ? (
        <ErrorState onRetry={() => void balances.refetch()} />
      ) : (
        <ScrollView
          contentContainerClassName="px-4 pb-10 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={balances.isRefetching}
              onRefresh={() => void balances.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View className="gap-1 mb-2">
            <Text className="p">{t("settle.subtitle")}</Text>
            {transfers.length > 0 ? (
              <Text className="text-sm font-semibold text-positive">
                {t("settle.count", { count: transfers.length })}
              </Text>
            ) : null}
          </View>
          {transfers.length === 0 ? (
            <EmptyState emoji="🎉" title={t("settle.nothing")} />
          ) : (
            transfers.map((transfer, index) => (
              <TransferCard
                key={`${transfer.from}-${transfer.to}`}
                index={index}
                transfer={transfer}
                fromName={nameOf(transfer.from)}
                toName={nameOf(transfer.to)}
                currency={balances.data.currency}
                loading={
                  settle.isPending &&
                  settle.variables?.fromUserId === transfer.from &&
                  settle.variables?.toUserId === transfer.to
                }
                onMarkPaid={() => markPaid(transfer)}
              />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
