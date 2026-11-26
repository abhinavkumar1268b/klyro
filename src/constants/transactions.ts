export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "UPI";

export const CLASSIFICATION_OPTIONS = [
  { value: "need", label: "Need", description: "Essentials" },
  { value: "want", label: "Want", description: "Discretionary" },
] as const;
