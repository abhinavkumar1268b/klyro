import { DEFAULT_CURRENCY } from "@/constants/app";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { DEFAULT_WALLET_IDS, WALLET_DEFINITIONS } from "@/constants/wallets";
import { localDateKey } from "@/lib/date";
import { db } from "./database";

/** Idempotent first-run setup: seed categories, preferences and wallets. */
export async function initializeDatabase(): Promise<void> {
  await db.transaction(
    "rw",
    db.categories,
    db.settings,
    db.wallets,
    async () => {
      if ((await db.categories.count()) === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES);
      }

      if (!(await db.settings.get("currency"))) {
        await db.settings.put({ key: "currency", value: DEFAULT_CURRENCY });
      }

      // Safe fallback for databases upgraded before wallet seeding, and for
      // installs where the v4 upgrade produced an empty table.
      if ((await db.wallets.count()) === 0) {
        const stamp = new Date().toISOString();
        const startDate = localDateKey();
        await db.wallets.bulkAdd(
          WALLET_DEFINITIONS.filter((wallet) =>
            DEFAULT_WALLET_IDS.includes(wallet.id as (typeof DEFAULT_WALLET_IDS)[number]),
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
    },
  );
}
