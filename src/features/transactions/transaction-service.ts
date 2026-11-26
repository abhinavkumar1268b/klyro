import { toMinorUnits } from "@/lib/calculations";
import { db } from "@/lib/db";
import type { TransactionFormValues } from "@/lib/validation";
import type { Transaction } from "@/types";

/** Domain operations for transactions. Components should call these, not Dexie. */
export function listTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy("date").reverse().toArray();
}

function toRecord(values: TransactionFormValues, createdAt: string, updatedAt: string) {
  return {
    type: values.type,
    amount: toMinorUnits(values.amount),
    categoryId: values.categoryId,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    date: values.date,
    paymentMethod: values.paymentMethod,
    classification: values.type === "expense" ? values.classification : undefined,
    createdAt,
    updatedAt,
  };
}

export async function addTransaction(values: TransactionFormValues): Promise<number> {
  const now = new Date().toISOString();
  const key = await db.transactions.add(toRecord(values, now, now));
  return key!;
}

export async function updateTransaction(id: number, values: TransactionFormValues): Promise<number> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error("Transaction not found");
  return db.transactions.update(
    id,
    toRecord(values, existing.createdAt, new Date().toISOString()),
  );
}

export function deleteTransaction(id: number): Promise<void> {
  return db.transactions.delete(id);
}
