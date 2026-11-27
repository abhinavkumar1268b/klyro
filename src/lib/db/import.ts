import type { MockData } from "@/lib/mock/data";
import { db } from "./database";

function stripId<T extends { id?: number }>(item: T): Omit<T, "id"> {
  const { id: ignored, ...rest } = item;
  void ignored;
  return rest;
}

/** Explicitly copy sample records into the real journal (Settings → Import samples). */
export async function importMockData(data: MockData): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.transactions,
      db.categories,
      db.budgets,
      db.goals,
      db.recurringPayments,
      db.wallets,
      db.walletTransfers,
      db.walletAdjustments,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.recurringPayments.clear(),
        db.wallets.clear(),
        db.walletTransfers.clear(),
        db.walletAdjustments.clear(),
      ]);

      await db.categories.bulkAdd(data.categories);
      await db.transactions.bulkAdd(data.transactions.map(stripId));
      await db.budgets.bulkAdd(data.budgets.map(stripId));
      await db.goals.bulkAdd(data.goals.map(stripId));
      await db.recurringPayments.bulkAdd(data.recurringPayments.map(stripId));
      await db.wallets.bulkAdd(data.wallets);
      await db.walletTransfers.bulkAdd(data.walletTransfers.map(stripId));
      await db.walletAdjustments.bulkAdd(data.walletAdjustments.map(stripId));
      await db.settings.put({
        key: `budget-plan-${data.budgetPlan.month}`,
        value: JSON.stringify(data.budgetPlan),
      });
    },
  );
}
