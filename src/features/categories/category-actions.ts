import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { CategoryFormValues } from "@/lib/validation";
import type { Category } from "@/types";
import { addCategory, deleteCategory, updateCategory } from "./category-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveCategory(values: CategoryFormValues, id?: string): Promise<void> {
  const category: Category = {
    id: id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: values.name.trim(),
    type: values.type,
    icon: values.icon,
    tint: values.tint,
    isDefault: false,
  };

  if (isDemo()) {
    const demo = useDemoStore.getState();
    if (id) demo.updateCategory(id, category);
    else demo.addCategory(category);
    return;
  }
  if (id) await updateCategory(id, category);
  else await addCategory(category);
}

export async function removeCategory(id: string): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().deleteCategory(id);
    return;
  }
  await deleteCategory(id);
}
