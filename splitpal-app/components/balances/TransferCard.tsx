import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { I18nManager, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useThemeColors } from "@/constants/theme";
import { useMoney } from "@/hooks/useMoney";
import type { Transfer } from "@/types/balances/BalanceTypes";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type TransferCardProps = {
  transfer: Transfer;
  fromName: string;
  toName: string;
  currency: CurrencyCode;
  onMarkPaid?: () => void;
  loading?: boolean;
  index?: number;
};

export default function TransferCard({
  transfer,
  fromName,
  toName,
  currency,
  onMarkPaid,
  loading,
  index = 0,
}: TransferCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const format = useMoney();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(420).springify().damping(18)}
      className="p-4 rounded-3xl bg-surface border border-border gap-3"
      style={{ boxShadow: "0 6px 20px -12px rgba(15, 23, 42, 0.18)" }}
    >
      <View className="flex-row items-center gap-3">
        <Avatar id={transfer.from} name={fromName} size={40} />
        <Ionicons
          name="arrow-forward"
          size={20}
          color={colors.muted}
          style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}
        />
        <Avatar id={transfer.to} name={toName} size={40} />
        <View className="flex-1">
          <Text numberOfLines={2} className="text-sm text-foreground">
            {t("settle.pays", { from: fromName, to: toName })}
          </Text>
          <Text className="text-lg font-bold text-foreground">
            {format(transfer.amount, currency)}
          </Text>
        </View>
      </View>
      {onMarkPaid ? (
        <Button
          label={t("settle.markPaid")}
          variant="secondary"
          size="sm"
          fullWidth
          loading={loading}
          onPress={onMarkPaid}
        />
      ) : null}
    </Animated.View>
  );
}
