import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/constants/options";
import type { CurrencyCode } from "@/types/common/CommonTypes";
import {
  isValidShareValue,
  parseAmount,
  summarizeSplit,
} from "@/utils/helper";

export const baseExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(120, "validation.tooLong"),
  amount: z.string(),
  category: z.enum(EXPENSE_CATEGORIES),
  paidBy: z.string().min(1, "validation.required"),
  splitType: z.enum(["equal", "exact", "percent"]),
  participants: z.array(
    z.object({
      userId: z.string(),
      included: z.boolean(),
      value: z.string(),
    }),
  ),
});

export type ExpenseFormValues = z.infer<typeof baseExpenseSchema>;

export const makeExpenseSchema = (currency: CurrencyCode) =>
  baseExpenseSchema.superRefine((values, ctx) => {
    const amount = parseAmount(values.amount, currency);
    if (amount === null || amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "validation.amount" });
    }

    if (!values.participants.some((p) => p.included)) {
      ctx.addIssue({
        code: "custom",
        path: ["participants"],
        message: "validation.participants",
      });
      return;
    }

    if (values.splitType === "equal") {
      return;
    }

    values.participants.forEach((participant, index) => {
      if (
        participant.included &&
        !isValidShareValue(participant.value, values.splitType, currency)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["participants", index, "value"],
          message:
            values.splitType === "exact" ? "validation.amount" : "validation.percent",
        });
      }
    });

    if (amount !== null && summarizeSplit(values, currency).remaining !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["participants"],
        message:
          values.splitType === "exact"
            ? "validation.exactMismatch"
            : "validation.percentMismatch",
      });
    }
  });
