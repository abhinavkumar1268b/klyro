import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name the category").max(40),
  type: z.enum(["income", "expense", "both"]),
  icon: z.string().min(1, "Choose an icon"),
  tint: z.enum(["neutral", "lime", "blue", "violet", "amber", "rose"]),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
