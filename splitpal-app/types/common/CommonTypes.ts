import type {
  CURRENCY_DECIMALS,
  SUPPORTED_LANGUAGES,
} from "@/constants/options";

export type CurrencyCode = keyof typeof CURRENCY_DECIMALS;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type ThemePreference = "system" | "light" | "dark";

export type CursorPage<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ApiErrorBody = {
  code?: string;
  message?: string | string[];
  statusCode?: number;
};
