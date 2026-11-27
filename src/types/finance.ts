/** Core domain types for KLYRO. */
export type TransactionType = "income" | "expense";
export type TransactionClassification = "need" | "want";

/** Restrained tint palette used for category/goal accents (never full-card colour). */
export type AccentTint =
  | "neutral"
  | "lime"
  | "blue"
  | "violet"
  | "amber"
  | "rose";

/**
 * All monetary values are stored as integer minor units (paise/cents).
 * Formatting and conversion happen at the edges via `lib/calculations/format`.
 */
export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  categoryId: string;
  title: string;
  description?: string;
  date: string;
  paymentMethod?: string;
  walletId?: string;
  classification?: TransactionClassification;
  sourceRecurringId?: number;
  createdAt: string;
  updatedAt: string;
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt">;
export type TransactionUpdate = Partial<NewTransaction>;

export interface Category {
  id: string;
  name: string;
  type: TransactionType | "both";
  icon: string;
  tint: AccentTint;
  isDefault: boolean;
}

export interface Budget {
  id?: number;
  categoryId: string;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export type NewBudget = Omit<Budget, "id" | "createdAt" | "updatedAt">;

export interface RecurringExpense {
  id: string;
  label: string;
  amount: number;
  dayOfMonth: number;
  categoryId?: string;
}

/** A month's top-level allocation. Savings here are planned, never transferred. */
export interface BudgetPlan {
  month: string;
  enabled: boolean;
  totalAvailable: number;
  spendingAllowance: number;
  protectedSavings: number;
  thresholds: number[];
  recurringExpenses: RecurringExpense[];
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  icon: string;
  tint: AccentTint;
  contributions: GoalContribution[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type NewGoal = Omit<
  Goal,
  "id" | "createdAt" | "updatedAt" | "completedAt" | "contributions"
>;

export interface Wallet {
  id: string;
  name: string;
  kind: "upi" | "cash" | "card" | "bank" | "other";
  icon: string;
  paymentMethod?: string;
  sortOrder: number;
  enabled: boolean;
  /** Balance at `startDate`; earlier transactions never affect the wallet. */
  openingBalance: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Internal money movement — never counted as income or an expense. */
export interface WalletTransfer {
  id?: number;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface WalletAdjustment {
  id?: number;
  walletId: string;
  /** Signed amount: positive adds money, negative removes it. */
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export interface RecurringPayment {
  id?: number;
  name: string;
  amount: number;
  categoryId: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  reminderDays: number;
  /** Off by default; explicitly enabled by the user with a clear explanation. */
  autoRecord: boolean;
  lastRecordedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewRecurringPayment = Omit<
  RecurringPayment,
  "id" | "createdAt" | "updatedAt" | "lastRecordedDate"
>;

export interface AppSetting {
  key: string;
  value: string;
}

export type DateRangePreset =
  | "this-month"
  | "last-month"
  | "last-3-months"
  | "this-year"
  | "all-time"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from?: string;
  to?: string;
}

export interface CashflowSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  ratio: number;
}
