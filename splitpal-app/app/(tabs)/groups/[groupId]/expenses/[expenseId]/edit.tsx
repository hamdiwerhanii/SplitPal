import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { getApiErrorMessage } from "@/api/errors";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import Screen from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import type { ExpenseFormValues } from "@/features/expenses/schema/expenseSchema";
import { useExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { useGroup } from "@/hooks/useGroups";
import useAuthStore from "@/stores/authStore";
import { buildExpensePayload, expenseToFormValues } from "@/utils/helper";

export default function EditExpenseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId, expenseId } = useLocalSearchParams<{ groupId: string; expenseId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const group = useGroup(groupId);
  const expense = useExpense(groupId, expenseId);
  const update = useUpdateExpense(groupId, expenseId);

  const onSubmit = (values: ExpenseFormValues) => {
    if (!group.data) return;
    update.mutate(buildExpensePayload(values, group.data.currency), {
      onSuccess: () => {
        Toast.show({ type: "success", text1: t("expense.updated") });
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
    <Screen title={t("expense.editTitle")} showBack>
      {group.isPending || expense.isPending ? (
        <LoadingState />
      ) : !group.data || !expense.data ? (
        <ErrorState onRetry={() => void expense.refetch()} />
      ) : (
        <ExpenseForm
          currency={group.data.currency}
          members={group.data.members}
          currentUserId={userId}
          defaultValues={expenseToFormValues(expense.data, group.data.members, group.data.currency)}
          submitLabel={t("common.save")}
          submitting={update.isPending}
          onSubmit={onSubmit}
        />
      )}
    </Screen>
  );
}
