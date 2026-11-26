import { db } from "@/lib/db";
import { localDateKey } from "@/lib/date";

interface ExportPayload {
  app: "KLYRO";
  exportedAt: string;
  categories: unknown[];
  transactions: unknown[];
  budgets: unknown[];
  goals: unknown[];
  recurringPayments: unknown[];
  settings: unknown[];
}

export async function exportAllData(): Promise<void> {
  const [categories, transactions, budgets, goals, recurringPayments, settings] = await Promise.all([
    db.categories.toArray(),
    db.transactions.toArray(),
    db.budgets.toArray(),
    db.goals.toArray(),
    db.recurringPayments.toArray(),
    db.settings.toArray(),
  ]);

  const payload: ExportPayload = {
    app: "KLYRO",
    exportedAt: new Date().toISOString(),
    categories,
    transactions,
    budgets,
    goals,
    recurringPayments,
    settings,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `klyro-backup-${localDateKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function resetAllData(): Promise<void> {
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
    },
  );
}
