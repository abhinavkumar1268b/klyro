import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { GoalFormValues } from "@/lib/validation";
import { addGoal, contributeToGoal, deleteGoal, updateGoal } from "./goal-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveGoal(values: GoalFormValues, id?: number): Promise<void> {
  if (isDemo()) {
    const demo = useDemoStore.getState();
    if (id !== undefined) demo.updateGoal(id, values);
    else demo.addGoal(values);
    return;
  }
  if (id !== undefined) await updateGoal(id, values);
  else await addGoal(values);
}

export async function addToGoal(id: number, amount: number, note?: string): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().contributeToGoal(id, amount, note);
    return;
  }
  await contributeToGoal(id, amount, note);
}

export async function removeGoal(id: number): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().deleteGoal(id);
    return;
  }
  await deleteGoal(id);
}
