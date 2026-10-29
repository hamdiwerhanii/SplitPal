export const queryKeys = {
  me: ["me"] as const,
  groups: {
    all: ["groups"] as const,
    list: () => ["groups", "list"] as const,
    detail: (groupId: string) => ["groups", "detail", groupId] as const,
    invite: (code: string) => ["groups", "invite", code] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (groupId: string) => ["expenses", "list", groupId] as const,
    detail: (groupId: string, expenseId: string) =>
      ["expenses", "detail", groupId, expenseId] as const,
  },
  balances: (groupId: string) => ["balances", groupId] as const,
  activity: ["activity"] as const,
};
