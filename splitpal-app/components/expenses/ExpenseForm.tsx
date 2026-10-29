import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import { ExpenseFormValues, makeExpenseSchema } from "@/features/expenses/schema/expenseSchema";
import { useMoney } from "@/hooks/useMoney";
import type { GroupMember } from "@/types/groups/GroupTypes";
import CategoryPicker from "./CategoryPicker";
import MemberChips from "./MemberChips";
import SplitEditor from "./SplitEditor";
import { summarizeSplit } from "@/utils/helper";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type ExpenseFormProps = {
  currency: CurrencyCode;
  members: GroupMember[];
  currentUserId: string;
  defaultValues: ExpenseFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ExpenseFormValues) => void;
};

export default function ExpenseForm({
  currency,
  members,
  currentUserId,
  defaultValues,
  submitLabel,
  submitting,
  onSubmit,
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const format = useMoney();
  const schema = useMemo(() => makeExpenseSchema(currency), [currency]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watched = useWatch({ control });
  const memberNames = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const payers = members.filter((m) => m.active || m.id === defaultValues.paidBy);

  const participantsError = (() => {
    const key = errors.participants?.message ?? errors.participants?.root?.message;
    if (!key) return undefined;
    const summary = summarizeSplit(
      {
        amount: watched.amount ?? "",
        splitType: watched.splitType ?? "equal",
        participants: (watched.participants ?? []).map((p) => ({
          userId: p?.userId ?? "",
          included: p?.included ?? false,
          value: p?.value ?? "",
        })),
      },
      currency,
    );
    return t(key, {
      total:
        watched.splitType === "percent"
          ? summary.assigned / 100
          : format(summary.assigned, currency),
      expected: format(summary.amount ?? 0, currency),
    });
  })();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-10 gap-5">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <FormInput
              testID="expense-amount-input"
              label={t("expense.amountLabel", { currency })}
              icon="cash-outline"
              placeholder="0"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="decimal-pad"
              suffix={currency}
              error={errors.amount?.message ? t(errors.amount.message) : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <FormInput
              testID="expense-description-input"
              label={t("expense.descriptionLabel")}
              icon="create-outline"
              placeholder={t("expense.descriptionPlaceholder")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={120}
              error={errors.description?.message ? t(errors.description.message) : undefined}
            />
          )}
        />

        <View className="gap-2">
          <Text className="label">{t("expense.categoryLabel")}</Text>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </View>

        <View className="gap-2">
          <Text className="label">{t("expense.paidByLabel")}</Text>
          <Controller
            control={control}
            name="paidBy"
            render={({ field }) => (
              <MemberChips
                members={payers}
                value={field.value}
                onChange={field.onChange}
                currentUserId={currentUserId}
                youLabel={t("common.you")}
              />
            )}
          />
        </View>

        <View className="gap-2">
          <Text className="label">{t("expense.splitLabel")}</Text>
          <SplitEditor
            control={control}
            currency={currency}
            memberNames={memberNames}
            currentUserId={currentUserId}
          />
          {participantsError ? (
            <Text className="text-negative text-sm">{participantsError}</Text>
          ) : null}
        </View>

        <Button
          testID="submit-expense"
          label={submitLabel}
          size="lg"
          fullWidth
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
