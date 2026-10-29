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

export const SUPPORTED_CURRENCIES = Object.keys(
  CURRENCY_DECIMALS,
) as (keyof typeof CURRENCY_DECIMALS)[];

export const EXPENSE_CATEGORIES = [
  "food",
  "groceries",
  "rent",
  "utilities",
  "transport",
  "travel",
  "entertainment",
  "shopping",
  "health",
  "gifts",
  "other",
] as const;

export const SUPPORTED_LANGUAGES = ["en", "fr", "ar"] as const;

export const OTP_LENGTH = 6;
export const FULL_PERCENT_BP = 10_000;
export const OUTBOX_BATCH_SIZE = 50;
