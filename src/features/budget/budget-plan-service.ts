import { db } from "@/lib/db";
import type { BudgetPlan } from "@/types";

const storageKey = (month: string) => `budget-plan-${month}`;

export async function listBudgetPlans(): Promise<Record<string, BudgetPlan>> {
  const rows = await db.settings.where("key").startsWith("budget-plan-").toArray();
  const plans: Record<string, BudgetPlan> = {};
  for (const row of rows) {
    try {
      const plan = JSON.parse(row.value) as BudgetPlan;
      plans[plan.month] = plan;
    } catch {
      // Ignore malformed settings records rather than breaking the app.
    }
  }
  return plans;
}

export async function getBudgetPlan(month: string): Promise<BudgetPlan | null> {
  const row = await db.settings.get(storageKey(month));
  if (!row) return null;
  try {
    return JSON.parse(row.value) as BudgetPlan;
  } catch {
    return null;
  }
}

export async function saveBudgetPlan(plan: BudgetPlan): Promise<void> {
  await db.settings.put({ key: storageKey(plan.month), value: JSON.stringify(plan) });
}

export async function deleteBudgetPlan(month: string): Promise<void> {
  await db.settings.delete(storageKey(month));
}
