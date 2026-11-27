import type { PaymentMethod } from "./transactions";

export const WALLET_DEFINITIONS = [
  {
    id: "upi",
    name: "UPI",
    icon: "Smartphone",
    paymentMethod: "UPI",
    description: "Digital payments",
  },
  {
    id: "cash",
    name: "Cash",
    icon: "Banknote",
    paymentMethod: "Cash",
    description: "Notes and coins",
  },
  {
    id: "bank",
    name: "Bank Account",
    icon: "Landmark",
    paymentMethod: "Bank Transfer",
    description: "Available for later",
  },
] as const;

export type WalletId = "upi" | "cash" | "bank";

export const DEFAULT_WALLET_IDS: WalletId[] = ["upi", "cash"];

/** Maps a transaction's payment method to the wallet it affects. */
export function walletIdForPaymentMethod(method?: string): WalletId | null {
  if (method === "UPI") return "upi";
  if (method === "Cash") return "cash";
  if (method === "Bank Transfer") return "bank";
  return null;
}

export function paymentMethodForWallet(id: WalletId): PaymentMethod {
  return (WALLET_DEFINITIONS.find((wallet) => wallet.id === id)?.paymentMethod as PaymentMethod) ?? "Other";
}
