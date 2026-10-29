import { z } from "zod";

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(254, "validation.tooLong")
    .email("validation.email"),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
