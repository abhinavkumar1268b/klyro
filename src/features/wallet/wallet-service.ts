import { db } from "@/lib/db";
import type { Wallet, WalletAdjustment, WalletTransfer } from "@/types";

export function listWallets(): Promise<Wallet[]> {
  return db.wallets.toArray();
}

export function listWalletTransfers(): Promise<WalletTransfer[]> {
  return db.walletTransfers.orderBy("date").reverse().toArray();
}

export function listWalletAdjustments(): Promise<WalletAdjustment[]> {
  return db.walletAdjustments.orderBy("date").reverse().toArray();
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  await db.wallets.put({ ...wallet, updatedAt: new Date().toISOString() });
}

export async function addWalletAdjustment(adjustment: WalletAdjustment): Promise<number> {
  const key = await db.walletAdjustments.add(adjustment);
  return key!;
}

export async function addWalletTransfer(transfer: WalletTransfer): Promise<number> {
  const key = await db.walletTransfers.add(transfer);
  return key!;
}
