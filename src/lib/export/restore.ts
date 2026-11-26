import { db } from "@/lib/db";
import type { BackupPayload } from "@/lib/validation";

/** Restores a validated backup atomically inside one IndexedDB transaction. */
export async function restoreBackup(payload: BackupPayload): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.transactions,
      db.categories,
      db.budgets,
      db.goals,
      db.recurringPayments,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.recurringPayments.clear(),
        db.settings.clear(),
      ]);

      await Promise.all([
        db.categories.bulkAdd(payload.categories),
        db.transactions.bulkAdd(payload.transactions),
        db.budgets.bulkAdd(payload.budgets),
        db.goals.bulkAdd(payload.goals),
        db.recurringPayments.bulkAdd(payload.recurringPayments),
        db.settings.bulkAdd(payload.settings),
      ]);
    },
  );
}
