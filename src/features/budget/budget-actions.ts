import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { BudgetFormValues } from "@/lib/validation";
import { deleteBudget, upsertBudget } from "./budget-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveBudget(values: BudgetFormValues): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().upsertBudget(values);
    return;
  }
  await upsertBudget(values);
}

export async function removeBudget(id: number): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().deleteBudget(id);
    return;
  }
  await deleteBudget(id);
}
