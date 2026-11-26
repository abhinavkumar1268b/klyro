import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { TransactionFormValues } from "@/lib/validation";
import { addTransaction, deleteTransaction, updateTransaction } from "./transaction-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveTransaction(values: TransactionFormValues, id?: number): Promise<void> {
  if (isDemo()) {
    const demo = useDemoStore.getState();
    if (id !== undefined) demo.updateTransaction(id, values);
    else demo.addTransaction(values);
    return;
  }

  if (id !== undefined) await updateTransaction(id, values);
  else await addTransaction(values);
}

export async function removeTransaction(id: number): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().deleteTransaction(id);
    return;
  }
  await deleteTransaction(id);
}
