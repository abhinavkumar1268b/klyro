import { z } from "zod";

export const recurringExpenseSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Name the recurring expense").max(80),
  amount: z.number({ error: "Enter an amount" }).nonnegative("Amount cannot be negative"),
  dayOfMonth: z
    .number({ error: "Enter a day" })
    .int("Use a whole day")
    .min(1, "Day must be between 1 and 31")
    .max(31, "Day must be between 1 and 31"),
  categoryId: z.string().optional(),
});

export const budgetPlanSchema = z
  .object({
    enabled: z.boolean(),
    totalAvailable: z
      .number({ error: "Enter the total available money" })
      .nonnegative("Amount cannot be negative"),
    spendingAllowance: z
      .number({ error: "Enter a spending allowance" })
      .nonnegative("Amount cannot be negative"),
    protectedSavings: z
      .number({ error: "Enter a savings allocation" })
      .nonnegative("Amount cannot be negative"),
    thresholds: z.array(z.number().min(1).max(100)),
    recurringExpenses: z.array(recurringExpenseSchema),
  })
  .refine(
    (values) => values.spendingAllowance + values.protectedSavings <= values.totalAvailable,
    {
      path: ["spendingAllowance"],
      message: "Spending allowance plus protected savings cannot exceed total available money",
    },
  );

export type BudgetPlanFormValues = z.infer<typeof budgetPlanSchema>;
