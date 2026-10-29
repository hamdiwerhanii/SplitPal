import Ionicons from "@expo/vector-icons/Ionicons";
import { Control, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";
import Avatar from "@/components/ui/Avatar";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useThemeColors } from "@/constants/theme";
import { ExpenseFormValues } from "@/features/expenses/schema/expenseSchema";
import { useMoney } from "@/hooks/useMoney";
import type { SplitType } from "@/types/expenses/ExpenseTypes";
import { splitEqually, summarizeSplit } from "@/utils/helper";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type SplitEditorProps = {
  control: Control<ExpenseFormValues>;
  currency: CurrencyCode;
  memberNames: Record<string, string>;
  currentUserId: string;
};

export default function SplitEditor({
  control,
  currency,
  memberNames,
  currentUserId,
}: SplitEditorProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const format = useMoney();
  const { fields } = useFieldArray({ control, name: "participants" });
  const values = useWatch({ control });
  const splitType = (values.splitType ?? "equal") as SplitType;
  const participants = (values.participants ?? []).map((p) => ({
    userId: p?.userId ?? "",
    included: p?.included ?? false,
    value: p?.value ?? "",
  }));

  const summary = summarizeSplit(
    { amount: values.amount ?? "", splitType, participants },
    currency,
  );
  const includedCount = participants.filter((p) => p.included).length;
  const equalShares = splitEqually(summary.amount ?? 0, includedCount);

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="splitType"
        render={({ field }) => (
          <SegmentedControl<SplitType>
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "equal", label: t("expense.equal") },
              { value: "exact", label: t("expense.exact") },
              { value: "percent", label: t("expense.percent") },
            ]}
          />
        )}
      />

      <View className="rounded-2xl bg-surface border border-border overflow-hidden">
        {fields.map((field, index) => {
          const participant = participants[index];
          const name =
            field.userId === currentUserId ? t("common.you") : (memberNames[field.userId] ?? "?");
          const equalIndex = participants
            .slice(0, index)
            .filter((p) => p.included).length;

          return (
            <View
              key={field.id}
              className={`flex-row items-center gap-3 px-3 py-2.5 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <Controller
                control={control}
                name={`participants.${index}.included`}
                render={({ field: included }) => (
                  <Pressable
                    onPress={() => included.onChange(!included.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: included.value }}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={included.value ? "checkbox" : "square-outline"}
                      size={24}
                      color={included.value ? colors.primary : colors.muted}
                    />
                  </Pressable>
                )}
              />
              <Avatar id={field.userId} name={memberNames[field.userId] ?? "?"} size={30} />
              <Text numberOfLines={1} className="flex-1 text-base text-foreground">
                {name}
              </Text>

              {splitType === "equal" ? (
                <Text className="text-sm text-muted">
                  {participant?.included && summary.amount
                    ? format(equalShares[equalIndex] ?? 0, currency)
                    : "—"}
                </Text>
              ) : (
                <Controller
                  control={control}
                  name={`participants.${index}.value`}
                  render={({ field: value, fieldState }) => (
                    <View
                      className={`flex-row items-center w-28 h-10 px-2 rounded-lg border ${
                        fieldState.error ? "border-negative" : "border-border"
                      } ${participant?.included ? "" : "opacity-40"}`}
                    >
                      <TextInput
                        editable={participant?.included}
                        value={value.value}
                        onChangeText={value.onChange}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        className="flex-1 text-base text-foreground text-right"
                      />
                      <Text className="text-muted ms-1">
                        {splitType === "percent" ? "%" : ""}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          );
        })}
      </View>

      {splitType !== "equal" && summary.remaining !== null && summary.remaining !== 0 ? (
        <Text className="text-sm text-warning">
          {splitType === "exact"
            ? t("expense.remaining", {
                amount: `${summary.remaining < 0 ? "−" : ""}${format(Math.abs(summary.remaining), currency)}`,
              })
            : t("expense.remainingPercent", { percent: summary.remaining / 100 })}
        </Text>
      ) : null}
    </View>
  );
}
