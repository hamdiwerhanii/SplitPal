import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(60, "validation.tooLong"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
