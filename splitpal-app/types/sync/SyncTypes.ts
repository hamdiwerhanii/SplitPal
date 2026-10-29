import type {
  CreateExpenseRequest,
  Expense,
} from "@/types/expenses/ExpenseTypes";

export type SyncOperation = {
  clientId: string;
  type: "expense.create";
  groupId: string;
  payload: Omit<CreateExpenseRequest, "clientId">;
};

export type SyncResult = {
  clientId: string;
  status: "created" | "duplicate" | "rejected";
  expense?: Expense;
  error?: { code: string; message: string };
};

export type OutboxItem = SyncOperation & {
  queuedAt: string;
  status: "pending" | "failed";
  error?: string;
};

export type SyncPartition = {
  done: string[];
  failed: { clientId: string; error: string }[];
};
