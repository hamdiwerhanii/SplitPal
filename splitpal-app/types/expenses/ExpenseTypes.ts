import type { EXPENSE_CATEGORIES } from "@/constants/options";

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type SplitType = "equal" | "exact" | "percent";

export type Expense = {
  id: string;
  group: string;
  clientId: string;
  createdBy: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  splitType: SplitType;
  splitInputs: { user: string; value: number | null }[];
  shares: { user: string; amount: number }[];
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseListItem = Expense & {
  pending?: boolean;
  failedReason?: string;
};

export type CreateExpenseRequest = {
  clientId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  splitType: SplitType;
  participants: { userId: string; value?: number }[];
  date: string;
};

export type UpdateExpenseRequest = Partial<Omit<CreateExpenseRequest, "clientId">>;

export type ExpensePayload = Omit<CreateExpenseRequest, "clientId" | "date">;

export type AddExpenseResult = {
  queued: boolean;
  expense?: Expense;
};

export type SplitParticipantInput = {
  userId: string;
  included: boolean;
  value: string;
};

export type SplitSummary = {
  amount: number | null;
  assigned: number;
  remaining: number | null;
};
