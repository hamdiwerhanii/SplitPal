import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import GradientCard from "@/components/ui/GradientCard";
import { useMoney } from "@/hooks/useMoney";
import type { GroupSummary } from "@/types/groups/GroupTypes";
import { totalsByCurrency } from "@/utils/helper";

export default function BalanceSummary({ groups }: { groups: GroupSummary[] }) {
  const { t } = useTranslation();
  const format = useMoney();
  const totals = totalsByCurrency(groups);
  const owesMoney = totals.some(([, amount]) => amount < 0);

  return (
    <GradientCard tone={owesMoney ? "negative" : "primary"} className="mb-5">
      <Text className="text-sm font-medium text-white/80">{t("groups.title")}</Text>
      {totals.length === 0 ? (
        <Text className="mt-1 text-2xl font-extrabold text-white">
          {t("groups.summarySettled")} ✨
        </Text>
      ) : (
        <View className="mt-1 gap-1">
          {totals.map(([currency, amount]) => (
            <Text
              key={currency}
              testID="balance-summary"
              className="text-2xl font-extrabold text-white"
            >
              {amount > 0
                ? t("groups.summaryOwed", { amount: format(amount, currency) })
                : t("groups.summaryOwe", { amount: format(-amount, currency) })}
            </Text>
          ))}
        </View>
      )}
      <Text className="mt-3 text-xs text-white/70">
        {t("groups.members", { count: groups.reduce((sum, g) => sum + g.memberCount, 0) })}
      </Text>
    </GradientCard>
  );
}
