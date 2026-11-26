import { DEFAULT_CURRENCY } from "@/constants/app";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { db } from "./database";

/** Idempotent first-run setup: seed categories and default preferences. */
export async function initializeDatabase(): Promise<void> {
  await db.transaction("rw", db.categories, db.settings, async () => {
    if ((await db.categories.count()) === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    }

    if (!(await db.settings.get("currency"))) {
      await db.settings.put({ key: "currency", value: DEFAULT_CURRENCY });
    }
  });
}
