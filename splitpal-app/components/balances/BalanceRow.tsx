import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Avatar from "@/components/ui/Avatar";
import { useMoney } from "@/hooks/useMoney";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type BalanceRowProps = {
  userId: string;
  name: string;
  net: number;
  currency: CurrencyCode;
};

export default function BalanceRow({ userId, name, net, currency }: BalanceRowProps) {
  const { t } = useTranslation();
  const format = useMoney();

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Avatar id={userId} name={name} size={38} />
      <Text numberOfLines={1} className="flex-1 text-base text-foreground">
        {name}
      </Text>
      {net === 0 ? (
        <Text className="text-sm text-muted">{t("balances.settled")}</Text>
      ) : (
        <Text className={`text-sm font-semibold ${net > 0 ? "text-positive" : "text-negative"}`}>
          {net > 0
            ? t("balances.getsBack", { amount: format(net, currency) })
            : t("balances.owes", { amount: format(-net, currency) })}
        </Text>
      )}
    </View>
  );
}
