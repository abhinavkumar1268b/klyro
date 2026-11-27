import type { PaymentMethod } from "./transactions";

export type WalletKind = "upi" | "cash" | "card" | "bank" | "other";

export interface WalletDefinition {
  id: string;
  kind: WalletKind;
  name: string;
  icon: string;
  paymentMethod: PaymentMethod;
  description: string;
}

export const WALLET_DEFINITIONS: WalletDefinition[] = [
  {
    id: "upi",
    kind: "upi",
    name: "UPI",
    icon: "Smartphone",
    paymentMethod: "UPI",
    description: "Digital payments",
  },
  {
    id: "cash",
    kind: "cash",
    name: "Cash",
    icon: "Banknote",
    paymentMethod: "Cash",
    description: "Notes and coins",
  },
  {
    id: "card",
    kind: "card",
    name: "Card",
    icon: "CreditCard",
    paymentMethod: "Debit Card",
    description: "Debit or credit card",
  },
  {
    id: "bank",
    kind: "bank",
    name: "Bank Account",
    icon: "Landmark",
    paymentMethod: "Bank Transfer",
    description: "Bank balance",
  },
];

export const DEFAULT_ENABLED_WALLET_IDS = ["upi", "cash"];

export const WALLET_ICONS = [
  "Smartphone",
  "Banknote",
  "CreditCard",
  "Landmark",
  "Wallet",
  "CircleDollarSign",
] as const;

/** Maps a legacy transaction's payment method to a default wallet id. */
export function walletIdForPaymentMethod(method?: string): string | null {
  if (method === "UPI") return "upi";
  if (method === "Cash") return "cash";
  if (method === "Debit Card" || method === "Credit Card") return "card";
  if (method === "Bank Transfer") return "bank";
  return null;
}

export function paymentMethodForWallet(
  wallet: string | { id: string; paymentMethod?: string },
): PaymentMethod {
  if (typeof wallet !== "string" && wallet.paymentMethod) {
    return wallet.paymentMethod as PaymentMethod;
  }
  const id = typeof wallet === "string" ? wallet : wallet.id;
  return WALLET_DEFINITIONS.find((item) => item.id === id)?.paymentMethod ?? "Other";
}

export function walletDefinitionForKind(kind: WalletKind): WalletDefinition | undefined {
  return WALLET_DEFINITIONS.find((item) => item.kind === kind);
}
