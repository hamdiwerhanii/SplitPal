import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CATEGORY_EMOJI } from "@/features/expenses/config/categories";
import { useDateFormatter, useMoney } from "@/hooks/useMoney";
import type { ExpenseListItem } from "@/types/expenses/ExpenseTypes";
import { myShareDelta } from "@/utils/helper";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type ExpenseRowProps = {
  expense: ExpenseListItem;
  currency: CurrencyCode;
  currentUserId: string;
  payerName: string;
  onPress?: () => void;
  onDiscard?: () => void;
  index?: number;
};

export default function ExpenseRow({
  expense,
  currency,
  currentUserId,
  payerName,
  onPress,
  onDiscard,
  index = 0,
}: ExpenseRowProps) {
  const { t } = useTranslation();
  const format = useMoney();
  const formatDate = useDateFormatter();
  const delta = expense.pending ? 0 : myShareDelta(expense, currentUserId);
  const involved =
    expense.paidBy === currentUserId || expense.shares.some((s) => s.user === currentUserId);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(380)}>
    <Pressable
      onPress={expense.pending ? undefined : onPress}
      className={`flex-row items-center gap-3 px-4 py-3 bg-surface active:opacity-80 ${
        expense.pending ? "opacity-70" : ""
      }`}
    >
      <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
        <Text className="text-xl">{CATEGORY_EMOJI[expense.category]}</Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {expense.description}
        </Text>
        <Text numberOfLines={1} className="text-sm text-muted">
          {t("group.paidBy", { name: payerName, amount: format(expense.amount, currency) })}
          {" · "}
          {formatDate(expense.date)}
        </Text>
        {expense.pending ? (
          <View className="flex-row items-center gap-3 mt-1">
            <Text
              className={`text-xs font-medium ${expense.failedReason ? "text-negative" : "text-warning"}`}
            >
              {expense.failedReason
                ? t("group.syncFailed", { reason: expense.failedReason })
                : t("group.waitingSync")}
            </Text>
            {expense.failedReason && onDiscard ? (
              <Pressable onPress={onDiscard} hitSlop={8}>
                <Text className="text-xs font-semibold text-primary">{t("group.discard")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      {!expense.pending ? (
        <View className="items-end">
          {!involved ? (
            <Text className="text-xs text-muted">{t("group.notInvolved")}</Text>
          ) : delta >= 0 ? (
            <Text className="text-xs text-positive">
              {t("group.youLent", { amount: format(delta, currency) })}
            </Text>
          ) : (
            <Text className="text-xs text-negative">
              {t("group.youBorrowed", { amount: format(-delta, currency) })}
            </Text>
          )}
        </View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}
