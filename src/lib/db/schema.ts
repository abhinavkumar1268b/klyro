import Dexie, { type EntityTable } from "dexie";
import { DB_NAME, DB_VERSION } from "@/constants/app";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import {
  DEFAULT_ENABLED_WALLET_IDS,
  WALLET_DEFINITIONS,
} from "@/constants/wallets";
import { localDateKey } from "@/lib/date";
import type {
  AppSetting,
  Budget,
  Category,
  Goal,
  RecurringPayment,
  Transaction,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
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

const STORES_V4 = {
  ...STORES_V3,
  transactions: "++id, type, date, categoryId, createdAt, sourceRecurringId, walletId",
  wallets: "id, enabled",
  walletTransfers: "++id, date",
  walletAdjustments: "++id, walletId, date",
};

const STORES_V5 = {
  ...STORES_V4,
  wallets: "id, enabled, sortOrder",
};

/** IndexedDB schema. All data is local-first and never leaves the device. */
export class KlyroDatabase extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  budgets!: EntityTable<Budget, "id">;
  goals!: EntityTable<Goal, "id">;
  recurringPayments!: EntityTable<RecurringPayment, "id">;
  wallets!: EntityTable<Wallet, "id">;
  walletTransfers!: EntityTable<WalletTransfer, "id">;
  walletAdjustments!: EntityTable<WalletAdjustment, "id">;
  settings!: EntityTable<AppSetting, "key">;

  constructor() {
    super(DB_NAME);

    this.version(1).stores(STORES_V1);

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

    this.version(3).stores(STORES_V3).upgrade(async (transaction) => {
      await transaction.table("goals").toCollection().modify((goal: Partial<Goal>) => {
        if (!goal.contributions) goal.contributions = [];
      });
    });

    // v4 introduces wallets. Existing transactions are left untouched: their
    // dates precede the wallet start date, so they are never credited twice.
    this.version(4).stores(STORES_V4).upgrade(async (transaction) => {
      if ((await transaction.table("wallets").count()) === 0) {
        const stamp = new Date().toISOString();
        const startDate = localDateKey();
        await transaction.table("wallets").bulkAdd(
          WALLET_DEFINITIONS.filter((wallet) =>
            DEFAULT_ENABLED_WALLET_IDS.includes(wallet.id),
          ).map((wallet) => ({
            id: wallet.id,
            name: wallet.name,
            icon: wallet.icon,
            enabled: true,
            openingBalance: 0,
            startDate,
            createdAt: stamp,
            updatedAt: stamp,
          })),
        );
      }
    });

    // v5 adds custom wallet metadata and the Card/Bank wallet types.
    // Nothing is deleted and no balance or opening balance is reset.
    this.version(DB_VERSION).stores(STORES_V5).upgrade(async (transaction) => {
      const existing = await transaction.table("wallets").toArray();
      const ids = new Set(existing.map((wallet: { id: string }) => wallet.id));

      await transaction.table("wallets").toCollection().modify((wallet: Partial<Wallet>) => {
        const definition = WALLET_DEFINITIONS.find((item) => item.id === wallet.id);
        if (!wallet.kind) wallet.kind = definition?.kind ?? "other";
        if (!wallet.paymentMethod) wallet.paymentMethod = definition?.paymentMethod ?? "Other";
        if (wallet.sortOrder === undefined) {
          wallet.sortOrder = WALLET_DEFINITIONS.findIndex((item) => item.id === wallet.id);
        }
      });

      const missing = WALLET_DEFINITIONS.filter((definition) => !ids.has(definition.id));
      if (missing.length > 0) {
        const stamp = new Date().toISOString();
        const startDate = localDateKey();
        await transaction.table("wallets").bulkAdd(
          missing.map((definition) => ({
            ...definition,
            enabled: DEFAULT_ENABLED_WALLET_IDS.includes(definition.id),
            openingBalance: 0,
            sortOrder: WALLET_DEFINITIONS.findIndex((item) => item.id === definition.id),
            startDate,
            createdAt: stamp,
            updatedAt: stamp,
          })),
        );
      }
    });
  }
}
