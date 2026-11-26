import { toMinorUnits } from "@/lib/calculations";
import { db } from "@/lib/db";
import type { BudgetFormValues } from "@/lib/validation";
import type { Budget } from "@/types";

export function listBudgets(month?: string): Promise<Budget[]> {
  return month
    ? db.budgets.where("month").equals(month).toArray()
    : db.budgets.toArray();
}

/** One budget per category per month — enforced by the compound index. */
export async function upsertBudget(values: BudgetFormValues): Promise<number> {
  const existing = await db.budgets
    .where("[month+categoryId]")
    .equals([values.month, values.categoryId])
    .first();
  const existingId = existing?.id;
  const now = new Date().toISOString();

  if (existingId !== undefined) {
    await db.budgets.update(existingId, {
      amount: toMinorUnits(values.amount),
      updatedAt: now,
    });
    return existingId;
  }

  const key = await db.budgets.add({
    categoryId: values.categoryId,
    month: values.month,
    amount: toMinorUnits(values.amount),
    createdAt: now,
    updatedAt: now,
  });
  return key!;
}

export function deleteBudget(id: number): Promise<void> {
  return db.budgets.delete(id);
}
