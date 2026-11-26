import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name your goal").max(80),
  targetAmount: z.number({ error: "Enter a target amount" }).positive("Set a target greater than zero"),
  savedAmount: z.number().min(0, "Saved amount cannot be negative"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  icon: z.string().min(1),
  tint: z.enum(["neutral", "lime", "blue", "violet", "amber", "rose"]),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
