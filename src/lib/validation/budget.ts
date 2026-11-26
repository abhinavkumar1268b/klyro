import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Use a valid month"),
  amount: z.number({ error: "Enter an amount" }).positive("Set a limit greater than zero"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
