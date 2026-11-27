import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type { Wallet, WalletAdjustment, WalletTransfer } from "@/types";
import {
  addWalletAdjustment,
  addWalletTransfer,
  saveWallet,
} from "./wallet-service";

const isDemo = () => useDataStore.getState().mode === "demo";

export async function saveWalletSettings(wallet: Wallet): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().updateWallet(wallet.id, wallet);
    return;
  }
  await saveWallet(wallet);
}

export async function recordWalletAdjustment(adjustment: WalletAdjustment): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().addWalletAdjustment(adjustment);
    return;
  }
  await addWalletAdjustment(adjustment);
}

export async function recordWalletTransfer(transfer: WalletTransfer): Promise<void> {
  if (isDemo()) {
    useDemoStore.getState().addWalletTransfer(transfer);
    return;
  }
  await addWalletTransfer(transfer);
}
