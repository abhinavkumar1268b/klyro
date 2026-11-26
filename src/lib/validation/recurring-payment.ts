import { z } from "zod";
import { isValidISODate } from "./transaction";

export const recurringPaymentSchema = z.object({
  name: z.string().trim().min(1, "Name the recurring payment").max(80),
  amount: z.number({ error: "Enter an amount" }).positive("Amount must be greater than zero"),
  categoryId: z.string().min(1, "Choose a category"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .refine(isValidISODate, "Use a valid date"),
  reminderDays: z
    .number({ error: "Enter reminder days" })
    .int("Use a whole number")
    .min(0, "Cannot be negative")
    .max(30, "Maximum 30 days"),
  autoRecord: z.boolean(),
});

export type RecurringPaymentFormValues = z.infer<typeof recurringPaymentSchema>;
