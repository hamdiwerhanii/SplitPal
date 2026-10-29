import { describe, expect, it } from "vitest";
import {
  ExpenseFormValues,
  makeExpenseSchema,
} from "@/features/expenses/schema/expenseSchema";

const base: ExpenseFormValues = {
  description: "Dinner",
  amount: "200",
  category: "food",
  paidBy: "a",
  splitType: "equal",
  participants: [
    { userId: "a", included: true, value: "" },
    { userId: "b", included: true, value: "" },
  ],
};

const errorsOf = (values: ExpenseFormValues) => {
  const result = makeExpenseSchema("TND").safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("expense schema", () => {
  it("accepts a valid equal split", () => {
    expect(errorsOf(base)).toEqual([]);
  });

  it("requires a positive amount with valid decimals", () => {
    expect(errorsOf({ ...base, amount: "0" })).toContain("validation.amount");
    expect(errorsOf({ ...base, amount: "1.2345" })).toContain("validation.amount");
  });

  it("requires at least one participant", () => {
    expect(
      errorsOf({
        ...base,
        participants: base.participants.map((p) => ({ ...p, included: false })),
      }),
    ).toContain("validation.participants");
  });

  it("checks that exact amounts add up", () => {
    expect(
      errorsOf({
        ...base,
        splitType: "exact",
        participants: [
          { userId: "a", included: true, value: "150" },
          { userId: "b", included: true, value: "40" },
        ],
      }),
    ).toContain("validation.exactMismatch");

    expect(
      errorsOf({
        ...base,
        splitType: "exact",
        participants: [
          { userId: "a", included: true, value: "150" },
          { userId: "b", included: true, value: "50" },
        ],
      }),
    ).toEqual([]);
  });

  it("checks that percentages reach 100", () => {
    expect(
      errorsOf({
        ...base,
        splitType: "percent",
        participants: [
          { userId: "a", included: true, value: "60" },
          { userId: "b", included: true, value: "30" },
        ],
      }),
    ).toContain("validation.percentMismatch");
  });

  it("flags an invalid share value", () => {
    expect(
      errorsOf({
        ...base,
        splitType: "percent",
        participants: [
          { userId: "a", included: true, value: "abc" },
          { userId: "b", included: true, value: "100" },
        ],
      }),
    ).toContain("validation.percent");
  });
});
