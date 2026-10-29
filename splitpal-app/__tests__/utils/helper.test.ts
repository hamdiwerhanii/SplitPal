import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expenses/ExpenseTypes";
import type { GroupMember, GroupSummary } from "@/types/groups/GroupTypes";
import {
  buildExpensePayload,
  expenseToFormValues,
  extractInviteCode,
  formatMoney,
  initialsOf,
  isCompleteOtp,
  myShareDelta,
  outboxToListItem,
  parseAmount,
  parsePercent,
  partitionSyncResults,
  sanitizeOtpInput,
  splitEqually,
  summarizeSplit,
  toInputAmount,
  totalsByCurrency,
} from "@/utils/helper";

const members: GroupMember[] = [
  { id: "a", name: "Ahmed", email: "a@x.tn", joinedAt: "", active: true },
  { id: "s", name: "Sarra", email: "s@x.tn", joinedAt: "", active: true },
  { id: "m", name: "Mehdi", email: "m@x.tn", joinedAt: "", active: false },
];

describe("money", () => {
  it("parses amounts into integer minor units", () => {
    expect(parseAmount("12.5", "TND")).toBe(12_500);
    expect(parseAmount("12,500", "TND")).toBe(12_500);
    expect(parseAmount("0.1", "EUR")).toBe(10);
    expect(parseAmount(" 200 ", "TND")).toBe(200_000);
  });

  it("rejects invalid amounts and too many decimals", () => {
    expect(parseAmount("12.5555", "TND")).toBeNull();
    expect(parseAmount("1.234", "EUR")).toBeNull();
    expect(parseAmount("-5", "EUR")).toBeNull();
    expect(parseAmount("abc", "EUR")).toBeNull();
    expect(parseAmount("", "EUR")).toBeNull();
  });

  it("avoids floating point errors", () => {
    const sum = (parseAmount("0.1", "EUR") ?? 0) + (parseAmount("0.2", "EUR") ?? 0);
    expect(sum).toBe(parseAmount("0.3", "EUR"));
  });

  it("round-trips amounts for editing", () => {
    expect(toInputAmount(12_500, "TND")).toBe("12.5");
    expect(toInputAmount(200_000, "TND")).toBe("200");
    expect(toInputAmount(1_005, "EUR")).toBe("10.05");
  });

  it("formats with the currency's decimals", () => {
    expect(formatMoney(12_500, "TND")).toContain("12.500");
    expect(formatMoney(1_050, "EUR")).toContain("10.50");
  });

  it("parses percentages into basis points", () => {
    expect(parsePercent("33.33")).toBe(3_333);
    expect(parsePercent("50")).toBe(5_000);
    expect(parsePercent("100.01")).toBeNull();
    expect(parsePercent("12.345")).toBeNull();
  });

  it("splits equally without losing a unit", () => {
    expect(splitEqually(10_000, 3)).toEqual([3_334, 3_333, 3_333]);
    expect(splitEqually(5, 0)).toEqual([]);
  });
});

describe("split summary", () => {
  it("reports what is left to assign for exact splits", () => {
    const summary = summarizeSplit(
      {
        amount: "100",
        splitType: "exact",
        participants: [
          { userId: "a", included: true, value: "60" },
          { userId: "s", included: true, value: "" },
          { userId: "m", included: false, value: "40" },
        ],
      },
      "TND",
    );
    expect(summary).toEqual({ amount: 100_000, assigned: 60_000, remaining: 40_000 });
  });

  it("reports percent remaining in basis points", () => {
    const summary = summarizeSplit(
      {
        amount: "100",
        splitType: "percent",
        participants: [
          { userId: "a", included: true, value: "70" },
          { userId: "s", included: true, value: "30" },
        ],
      },
      "EUR",
    );
    expect(summary.remaining).toBe(0);
  });
});

describe("expense payload", () => {
  it("builds the API payload from form values", () => {
    const payload = buildExpensePayload(
      {
        description: "  Dinner ",
        amount: "200",
        category: "food",
        paidBy: "a",
        splitType: "percent",
        participants: [
          { userId: "a", included: true, value: "50" },
          { userId: "s", included: true, value: "50" },
          { userId: "m", included: false, value: "" },
        ],
      },
      "TND",
    );
    expect(payload).toEqual({
      description: "Dinner",
      amount: 200_000,
      category: "food",
      paidBy: "a",
      splitType: "percent",
      participants: [
        { userId: "a", value: 5_000 },
        { userId: "s", value: 5_000 },
      ],
    });
  });

  it("maps an existing expense back to form values", () => {
    const expense = {
      id: "e1",
      description: "Rent",
      amount: 1_200_000,
      category: "rent",
      paidBy: "a",
      splitType: "exact",
      splitInputs: [
        { user: "a", value: 700_000 },
        { user: "m", value: 500_000 },
      ],
      shares: [],
    } as unknown as Expense;

    const values = expenseToFormValues(expense, members, "TND");
    expect(values.amount).toBe("1200");
    expect(values.participants).toEqual([
      { userId: "a", included: true, value: "700" },
      { userId: "s", included: false, value: "" },
      { userId: "m", included: true, value: "500" },
    ]);
  });

  it("computes what an expense means for me", () => {
    const expense = {
      paidBy: "a",
      amount: 600_000,
      shares: [
        { user: "a", amount: 150_000 },
        { user: "s", amount: 450_000 },
      ],
    } as Expense;
    expect(myShareDelta(expense, "a")).toBe(450_000);
    expect(myShareDelta(expense, "s")).toBe(-450_000);
    expect(myShareDelta(expense, "m")).toBe(0);
  });
});

describe("offline sync", () => {
  it("removes created and duplicate operations and keeps rejected ones", () => {
    expect(
      partitionSyncResults([
        { clientId: "1", status: "created" },
        { clientId: "2", status: "duplicate" },
        { clientId: "3", status: "rejected", error: { code: "X", message: "Bad split" } },
      ]),
    ).toEqual({ done: ["1", "2"], failed: [{ clientId: "3", error: "Bad split" }] });
  });

  it("shows queued expenses as pending list items", () => {
    const item = outboxToListItem(
      {
        clientId: "c1",
        type: "expense.create",
        groupId: "g1",
        queuedAt: "2026-10-28T10:00:00.000Z",
        status: "failed",
        error: "Group not found",
        payload: {
          description: "Fuel",
          amount: 120_000,
          category: "transport",
          paidBy: "s",
          splitType: "equal",
          participants: [{ userId: "s" }],
          date: "2026-10-28T10:00:00.000Z",
        },
      },
      "s",
    );
    expect(item).toMatchObject({ id: "c1", pending: true, failedReason: "Group not found" });
  });
});

describe("misc", () => {
  it("builds initials", () => {
    expect(initialsOf("Hamdi Werhani")).toBe("HW");
    expect(initialsOf("sarra")).toBe("SA");
    expect(initialsOf("  ")).toBe("?");
  });

  it("sanitizes OTP input", () => {
    expect(sanitizeOtpInput("12 34-5678")).toBe("123456");
    expect(isCompleteOtp("123456")).toBe(true);
    expect(isCompleteOtp("12345")).toBe(false);
  });

  it("extracts invite codes from links and raw codes", () => {
    expect(extractInviteCode("splitpal://join/k7px2m9q")).toBe("K7PX2M9Q");
    expect(extractInviteCode("Join us: https://splitpal.app/join/K7PX2M9Q (code)")).toBe("K7PX2M9Q");
    expect(extractInviteCode(" k7px2m9q ")).toBe("K7PX2M9Q");
  });

  it("sums balances per currency and hides zero totals", () => {
    const groups = [
      { currency: "TND", myBalance: 145_000 },
      { currency: "TND", myBalance: -45_000 },
      { currency: "EUR", myBalance: 0 },
    ] as GroupSummary[];
    expect(totalsByCurrency(groups)).toEqual([["TND", 100_000]]);
  });
});
