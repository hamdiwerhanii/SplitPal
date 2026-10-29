import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/constants/options";

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(60, "validation.tooLong"),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type GroupFormValues = z.infer<typeof groupSchema>;

export const joinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z2-9]{8}$/, "validation.inviteCode"),
});

export type JoinFormValues = z.infer<typeof joinSchema>;
