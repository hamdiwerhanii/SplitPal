import type { CreateExpenseRequest, Expense, UpdateExpenseRequest } from "@/types/expenses/ExpenseTypes";
import API from "./client";
import type { CursorPage } from "@/types/common/CommonTypes";

export const getExpenses = async (
  groupId: string,
  cursor?: string | null,
): Promise<CursorPage<Expense>> => {
  const { data } = await API.get<CursorPage<Expense>>(
    `/groups/${groupId}/expenses`,
    { params: { limit: 20, ...(cursor ? { cursor } : {}) } },
  );
  return data;
};

export const getExpense = async (
  groupId: string,
  expenseId: string,
): Promise<Expense> => {
  const { data } = await API.get<Expense>(
    `/groups/${groupId}/expenses/${expenseId}`,
  );
  return data;
};

export const createExpense = async (
  groupId: string,
  body: CreateExpenseRequest,
): Promise<Expense> => {
  const { data } = await API.post<Expense>(`/groups/${groupId}/expenses`, body);
  return data;
};

export const updateExpense = async (
  groupId: string,
  expenseId: string,
  body: UpdateExpenseRequest,
): Promise<Expense> => {
  const { data } = await API.patch<Expense>(
    `/groups/${groupId}/expenses/${expenseId}`,
    body,
  );
  return data;
};

export const deleteExpense = async (
  groupId: string,
  expenseId: string,
): Promise<void> => {
  await API.delete(`/groups/${groupId}/expenses/${expenseId}`);
};
