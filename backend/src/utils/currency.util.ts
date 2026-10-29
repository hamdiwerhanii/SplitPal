export const CURRENCY_DECIMALS = {
  TND: 3,
  EUR: 2,
  USD: 2,
  GBP: 2,
  MAD: 2,
  DZD: 2,
  EGP: 2,
  SAR: 2,
  AED: 2,
  CAD: 2,
} as const;

export type CurrencyCode = keyof typeof CURRENCY_DECIMALS;

export const SUPPORTED_CURRENCIES = Object.keys(
  CURRENCY_DECIMALS,
) as CurrencyCode[];

export const formatMinorUnits = (
  amount: number,
  currency: CurrencyCode,
  locale = 'en',
): string => {
  const decimals = CURRENCY_DECIMALS[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount / 10 ** decimals);
};
