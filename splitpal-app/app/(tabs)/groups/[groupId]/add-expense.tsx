import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { getApiErrorMessage } from "@/api/errors";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import Screen from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import type { ExpenseFormValues } from "@/features/expenses/schema/expenseSchema";
import { useAddExpense } from "@/hooks/useExpenses";
import { useGroup } from "@/hooks/useGroups";
import useAuthStore from "@/stores/authStore";
import { buildExpensePayload, defaultExpenseValues } from "@/utils/helper";

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const { data: group, isPending, refetch } = useGroup(groupId);
  const addExpense = useAddExpense(groupId);

  const onSubmit = (values: ExpenseFormValues) => {
    if (!group) return;
    addExpense.mutate(buildExpensePayload(values, group.currency), {
      onSuccess: ({ queued }) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: queued ? "info" : "success",
          text1: queued ? t("expense.savedOffline") : t("expense.saved"),
        });
        router.back();
      },
      onError: (error) =>
        Toast.show({
          type: "error",
          text1: t("common.somethingWrong"),
          text2: getApiErrorMessage(error),
        }),
    });
  };

  return (
    <Screen title={t("expense.addTitle")} showBack>
      {isPending ? (
        <LoadingState />
      ) : !group ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ExpenseForm
          currency={group.currency}
          members={group.members}
          currentUserId={userId}
          defaultValues={defaultExpenseValues(group.members, userId)}
          submitLabel={t("expense.submit")}
          submitting={addExpense.isPending}
          onSubmit={onSubmit}
        />
      )}
    </Screen>
  );
}
