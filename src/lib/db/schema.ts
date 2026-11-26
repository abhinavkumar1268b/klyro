import Dexie, { type EntityTable } from "dexie";
import { DB_NAME, DB_VERSION } from "@/constants/app";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type {
  AppSetting,
  Budget,
  Category,
  Goal,
  RecurringPayment,
  Transaction,
} from "@/types";

const STORES_V1 = {
  transactions: "++id, type, date, categoryId, createdAt",
  categories: "id, type",
  budgets: "++id, month, categoryId, &[month+categoryId]",
  goals: "++id, createdAt",
  settings: "key",
};

const STORES_V2 = STORES_V1;

const STORES_V3 = {
  ...STORES_V2,
  transactions: "++id, type, date, categoryId, createdAt, sourceRecurringId",
  recurringPayments: "++id, nextDueDate, frequency",
};

/**
 * IndexedDB schema. All data is local-first and never leaves the device.
 * Indexes are intentionally narrow: list queries filter on date/category/month.
 */
export class KlyroDatabase extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  budgets!: EntityTable<Budget, "id">;
  goals!: EntityTable<Goal, "id">;
  recurringPayments!: EntityTable<RecurringPayment, "id">;
  settings!: EntityTable<AppSetting, "key">;

  constructor() {
    super(DB_NAME);

    this.version(1).stores(STORES_V1);

    // v2 adds titles, descriptions, payment methods and need/want classes.
    this.version(2).stores(STORES_V2).upgrade(async (transaction) => {
      await transaction
        .table("transactions")
        .toCollection()
        .modify((record: Partial<Transaction> & { description?: string }) => {
          if (!record.title) record.title = record.description || "Untitled transaction";
          if (record.categoryId === "transport") record.categoryId = "travel";
          if (!record.paymentMethod) record.paymentMethod = "UPI";
          if (record.type === "expense" && !record.classification) record.classification = "need";
        });

      await transaction.table("budgets").toCollection().modify((record: Budget) => {
        if (record.categoryId === "transport") record.categoryId = "travel";
      });

      await transaction.table("categories").clear();
      await transaction.table("categories").bulkAdd(DEFAULT_CATEGORIES);
    });

    // v3 adds contribution history on goals and recurring payment reminders.
    this.version(DB_VERSION).stores(STORES_V3).upgrade(async (transaction) => {
      await transaction.table("goals").toCollection().modify((goal: Partial<Goal>) => {
        if (!goal.contributions) goal.contributions = [];
      });
    });
  }
}
