import { db } from "@/lib/db";
import type { Category } from "@/types";

export function listCategories(): Promise<Category[]> {
  return db.categories.toArray();
}

export function addCategory(category: Category): Promise<string> {
  return db.categories.add(category);
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<void> {
  await db.categories.update(id, patch);
}

export function deleteCategory(id: string): Promise<void> {
  return db.categories.delete(id);
}
