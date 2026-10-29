import {
  CURRENCY_DECIMALS,
  FULL_PERCENT_BP,
  OTP_LENGTH,
} from "@/constants/options";
import type { ExpenseFormValues } from "@/features/expenses/schema/expenseSchema";
import type { AppLanguage, CurrencyCode } from "@/types/common/CommonTypes";
import type {
  Expense,
  ExpenseListItem,
  ExpensePayload,
  SplitParticipantInput,
  SplitSummary,
  SplitType,
} from "@/types/expenses/ExpenseTypes";
import type { GroupMember, GroupSummary } from "@/types/groups/GroupTypes";
import type { OutboxItem, SyncPartition, SyncResult } from "@/types/sync/SyncTypes";

const INTL_LOCALES: Record<AppLanguage, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-TN",
};

export const parseAmount = (
  input: string,
  currency: CurrencyCode,
): number | null => {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const decimals = CURRENCY_DECIMALS[currency];
  if (fraction.length > decimals) {
    return null;
  }

  const minor =
    Number(whole) * 10 ** decimals + Number(fraction.padEnd(decimals, "0") || 0);
  return Number.isSafeInteger(minor) ? minor : null;
};

export const toInputAmount = (amount: number, currency: CurrencyCode): string => {
  const decimals = CURRENCY_DECIMALS[currency];
  const whole = Math.floor(amount / 10 ** decimals);
  const fraction = (amount % 10 ** decimals).toString().padStart(decimals, "0");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}`;
};

export const formatMoney = (
  amount: number,
  currency: CurrencyCode,
  language: AppLanguage = "en",
): string => {
  const decimals = CURRENCY_DECIMALS[currency];
  return new Intl.NumberFormat(INTL_LOCALES[language] ?? language, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount / 10 ** decimals);
};

export const formatDate = (
  value: string | Date,
  language: AppLanguage = "en",
  withTime = false,
): string =>
  new Intl.DateTimeFormat(INTL_LOCALES[language] ?? language, {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));

export const parsePercent = (input: string): number | null => {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const basisPoints = Math.round(Number(normalized) * 100);
  return basisPoints <= FULL_PERCENT_BP ? basisPoints : null;
};

export const splitEqually = (amount: number, count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
};

export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters =
    parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[1][0]}`;
  return letters.toUpperCase();
};

export const colorIndexFor = (id: string, size: number): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % size;
};

export const sanitizeOtpInput = (value: string): string =>
  value.replace(/\D/g, "").slice(0, OTP_LENGTH);

export const isCompleteOtp = (value: string): boolean =>
  new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);

export const extractInviteCode = (input: string): string => {
  const trimmed = input.trim();
  const fromLink = trimmed.match(/join\/([A-Za-z0-9]{8})\b/);
  return (fromLink ? fromLink[1] : trimmed).toUpperCase();
};

export const totalsByCurrency = (
  groups: GroupSummary[],
): [CurrencyCode, number][] => {
  const totals = new Map<CurrencyCode, number>();
  for (const group of groups) {
    totals.set(group.currency, (totals.get(group.currency) ?? 0) + group.myBalance);
  }
  return [...totals].filter(([, amount]) => amount !== 0);
};

export const partitionSyncResults = (results: SyncResult[]): SyncPartition => ({
  done: results
    .filter((result) => result.status === "created" || result.status === "duplicate")
    .map((result) => result.clientId),
  failed: results
    .filter((result) => result.status === "rejected")
    .map((result) => ({
      clientId: result.clientId,
      error: result.error?.message ?? "Rejected",
    })),
});

export const outboxToListItem = (
  item: OutboxItem,
  userId: string,
): ExpenseListItem => ({
  ...item.payload,
  id: item.clientId,
  group: item.groupId,
  clientId: item.clientId,
  createdBy: userId,
  splitInputs: [],
  shares: [],
  createdAt: item.queuedAt,
  updatedAt: item.queuedAt,
  pending: true,
  failedReason: item.status === "failed" ? item.error : undefined,
});

const valueParser = (splitType: SplitType, currency: CurrencyCode) =>
  splitType === "exact"
    ? (value: string) => parseAmount(value, currency)
    : parsePercent;

export const summarizeSplit = (
  values: {
    amount: string;
    splitType: SplitType;
    participants: SplitParticipantInput[];
  },
  currency: CurrencyCode,
): SplitSummary => {
  const amount = parseAmount(values.amount, currency);
  if (values.splitType === "equal") {
    return { amount, assigned: amount ?? 0, remaining: 0 };
  }

  const parse = valueParser(values.splitType, currency);
  const total = values.splitType === "exact" ? amount : FULL_PERCENT_BP;
  const assigned = values.participants
    .filter((p) => p.included)
    .reduce(
      (sum, p) => sum + (p.value.trim() === "" ? 0 : (parse(p.value) ?? 0)),
      0,
    );
  return { amount, assigned, remaining: total === null ? null : total - assigned };
};

export const isValidShareValue = (
  value: string,
  splitType: SplitType,
  currency: CurrencyCode,
): boolean => value.trim() === "" || valueParser(splitType, currency)(value) !== null;

export const buildExpensePayload = (
  values: ExpenseFormValues,
  currency: CurrencyCode,
): ExpensePayload => {
  const parse = valueParser(values.splitType, currency);
  return {
    description: values.description.trim(),
    amount: parseAmount(values.amount, currency) ?? 0,
    category: values.category,
    paidBy: values.paidBy,
    splitType: values.splitType,
    participants: values.participants
      .filter((p) => p.included)
      .map((p) =>
        values.splitType === "equal"
          ? { userId: p.userId }
          : {
              userId: p.userId,
              value: p.value.trim() === "" ? 0 : (parse(p.value) ?? 0),
            },
      ),
  };
};

export const defaultExpenseValues = (
  members: GroupMember[],
  currentUserId: string,
): ExpenseFormValues => ({
  description: "",
  amount: "",
  category: "food",
  paidBy: currentUserId,
  splitType: "equal",
  participants: members
    .filter((m) => m.active)
    .map((m) => ({ userId: m.id, included: true, value: "" })),
});

export const expenseToFormValues = (
  expense: Expense,
  members: GroupMember[],
  currency: CurrencyCode,
): ExpenseFormValues => {
  const inputs = new Map(expense.splitInputs.map((i) => [i.user, i.value]));
  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return expense.splitType === "exact"
      ? toInputAmount(value, currency)
      : String(value / 100);
  };

  return {
    description: expense.description,
    amount: toInputAmount(expense.amount, currency),
    category: expense.category,
    paidBy: expense.paidBy,
    splitType: expense.splitType,
    participants: members
      .filter((m) => m.active || inputs.has(m.id))
      .map((m) => ({
        userId: m.id,
        included: inputs.has(m.id),
        value: formatValue(inputs.get(m.id)),
      })),
  };
};

export const myShareDelta = (expense: Expense, userId: string): number => {
  const share = expense.shares.find((s) => s.user === userId)?.amount ?? 0;
  const paid = expense.paidBy === userId ? expense.amount : 0;
  return paid - share;
};
