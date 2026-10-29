import { Text } from "react-native";
import { useMoney } from "@/hooks/useMoney";
import type { CurrencyCode } from "@/types/common/CommonTypes";

type AmountTextProps = {
  amount: number;
  currency: CurrencyCode;
  signed?: boolean;
  className?: string;
};

export default function AmountText({
  amount,
  currency,
  signed = false,
  className = "",
}: AmountTextProps) {
  const format = useMoney();
  const tone =
    !signed || amount === 0 ? "text-foreground" : amount > 0 ? "text-positive" : "text-negative";
  const prefix = signed && amount > 0 ? "+" : signed && amount < 0 ? "−" : "";

  return (
    <Text className={`font-semibold ${tone} ${className}`}>
      {prefix}
      {format(Math.abs(amount), currency)}
    </Text>
  );
}
