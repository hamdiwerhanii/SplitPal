import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Screen from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import { CATEGORY_EMOJI } from "@/features/expenses/config/categories";
import { useDeleteExpense, useExpense } from "@/hooks/useExpenses";
import { useGroup } from "@/hooks/useGroups";
import { useDateFormatter, useMoney } from "@/hooks/useMoney";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import useAuthStore from "@/stores/authStore";

export default function ExpenseDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const format = useMoney();
  const formatDate = useDateFormatter();
  const { isOffline } = useNetworkStatus();
  const { groupId, expenseId } = useLocalSearchParams<{ groupId: string; expenseId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const group = useGroup(groupId);
  const expense = useExpense(groupId, expenseId);
  const remove = useDeleteExpense(groupId);

  if (expense.isPending || group.isPending) {
    return (
      <Screen showBack>
        <LoadingState />
      </Screen>
    );
  }
  if (!expense.data || !group.data) {
    return (
      <Screen showBack>
        <ErrorState onRetry={() => void expense.refetch()} />
      </Screen>
    );
  }

  const item = expense.data;
  const currency = group.data.currency;
  const nameOf = (id: string) =>
    id === userId ? t("common.you") : (group.data.members.find((m) => m.id === id)?.name ?? "?");

  const confirmDelete = () =>
    Alert.alert(t("expense.deleteTitle"), t("expense.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          remove.mutate(item.id, {
            onSuccess: () => {
              Toast.show({ type: "success", text1: t("expense.deleted") });
              router.back();
            },
            onError: () => Toast.show({ type: "error", text1: t("common.somethingWrong") }),
          }),
      },
    ]);

  const goEdit = () =>
    isOffline
      ? Toast.show({ type: "error", text1: t("expense.offlineEdit") })
      : router.push({
          pathname: "/groups/[groupId]/expenses/[expenseId]/edit",
          params: { groupId, expenseId },
        });

  return (
    <Screen
      title={t("expense.detailTitle")}
      showBack
      right={<IconButton icon="create-outline" label={t("expense.edit")} onPress={goEdit} />}
    >
      <ScrollView contentContainerClassName="px-4 pb-10 gap-5">
        <View className="items-center gap-2 py-4">
          <View className="w-16 h-16 rounded-2xl bg-surface-muted items-center justify-center">
            <Text className="text-3xl">{CATEGORY_EMOJI[item.category]}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground text-center">{item.description}</Text>
          <Text className="text-3xl font-extrabold text-foreground">
            {format(item.amount, currency)}
          </Text>
          <Text className="text-sm text-muted">
            {t("group.paidBy", { name: nameOf(item.paidBy), amount: format(item.amount, currency) })}
          </Text>
          <Text className="text-xs text-muted">
            {t("expense.addedBy", { name: nameOf(item.createdBy), date: formatDate(item.date, true) })}
          </Text>
        </View>

        <View className="rounded-2xl bg-surface border border-border">
          <Text className="label px-4 pt-3 pb-1">
            {t("expense.splitBetween")} · {t(`expense.${item.splitType}`)}
          </Text>
          {item.shares.map((share, index) => (
            <View
              key={share.user}
              className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border" : ""}`}
            >
              <Avatar id={share.user} name={nameOf(share.user)} size={32} />
              <Text className="flex-1 text-base text-foreground">{nameOf(share.user)}</Text>
              <Text className="text-base font-semibold text-foreground">
                {format(share.amount, currency)}
              </Text>
            </View>
          ))}
        </View>

        <Button
          label={t("common.delete")}
          variant="ghost"
          fullWidth
          loading={remove.isPending}
          onPress={confirmDelete}
          className="mt-2"
        />
      </ScrollView>
    </Screen>
  );
}
