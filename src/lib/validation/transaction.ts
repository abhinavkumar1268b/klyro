import { z } from "zod";
import { PAYMENT_METHODS } from "@/constants/transactions";

export function isValidISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z
      .number({ error: "Enter an amount" })
      .finite("Enter a valid amount")
      .positive("Enter an amount greater than zero")
      .max(100_000_000, "Amount is too large"),
    categoryId: z.string().min(1, "Choose a category"),
    title: z.string().trim().min(1, "Add a transaction title").max(120, "Title is too long"),
    description: z.string().trim().max(500, "Description is too long").optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
      .refine(isValidISODate, "Use a valid date"),
    paymentMethod: z.enum(PAYMENT_METHODS),
    classification: z.enum(["need", "want"]).optional(),
  })
  .superRefine((values, context) => {
    if (values.type === "expense" && !values.classification) {
      context.addIssue({
        code: "custom",
        path: ["classification"],
        message: "Choose need or want",
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
