import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { BudgetPlan } from "@/types";
import { saveBudgetPlan } from "./budget-plan-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function savePlan(plan: BudgetPlan): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().setBudgetPlan(plan);
    return;
  }
  await saveBudgetPlan(plan);
}
