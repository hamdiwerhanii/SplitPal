import { useCallback } from "react";
import useSettingsStore from "@/stores/settingsStore";
import type { CurrencyCode } from "@/types/common/CommonTypes";
import { formatDate, formatMoney } from "@/utils/helper";

export const useMoney = () => {
  const language = useSettingsStore((state) => state.language);
  return useCallback(
    (amount: number, currency: CurrencyCode) =>
      formatMoney(amount, currency, language),
    [language],
  );
};

export const useDateFormatter = () => {
  const language = useSettingsStore((state) => state.language);
  return useCallback(
    (value: string | Date, withTime = false) =>
      formatDate(value, language, withTime),
    [language],
  );
};
