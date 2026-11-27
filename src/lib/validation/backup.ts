import { z } from "zod";

const timestamp = z.string().min(1);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthString = z.string().regex(/^\d{4}-\d{2}$/);

const transaction = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.number().int().nonnegative(),
  categoryId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  date: dateString,
  paymentMethod: z.string().optional(),
  walletId: z.string().optional(),
  classification: z.enum(["need", "want"]).optional(),
  sourceRecurringId: z.number().optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const category = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["income", "expense", "both"]),
  icon: z.string().min(1),
  tint: z.enum(["neutral", "lime", "blue", "violet", "amber", "rose"]),
  isDefault: z.boolean(),
});

const budget = z.object({
  id: z.number().int().positive().optional(),
  categoryId: z.string().min(1),
  month: monthString,
  amount: z.number().int().nonnegative(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const contribution = z.object({
  id: z.string().min(1),
  amount: z.number().int(),
  date: dateString,
  note: z.string().optional(),
  createdAt: timestamp,
});

const goal = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  targetAmount: z.number().int().nonnegative(),
  savedAmount: z.number().int().nonnegative(),
  deadline: dateString.optional(),
  icon: z.string().min(1),
  tint: z.enum(["neutral", "lime", "blue", "violet", "amber", "rose"]),
  contributions: z.array(contribution).default([]),
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp.optional(),
});

const recurringPayment = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  amount: z.number().int().nonnegative(),
  categoryId: z.string().min(1),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  nextDueDate: dateString,
  reminderDays: z.number().int().nonnegative(),
  autoRecord: z.boolean(),
  lastRecordedDate: dateString.optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

const wallet = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["upi", "cash", "card", "bank", "other"]).default("other"),
  icon: z.string().min(1),
  paymentMethod: z.string().optional(),
  sortOrder: z.number().int().default(0),
  enabled: z.boolean(),
  openingBalance: z.number().int(),
  startDate: dateString,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const walletTransfer = z.object({
  id: z.number().int().positive().optional(),
  fromWalletId: z.string().min(1),
  toWalletId: z.string().min(1),
  amount: z.number().int(),
  date: dateString,
  note: z.string().optional(),
  createdAt: timestamp,
});

const walletAdjustment = z.object({
  id: z.number().int().positive().optional(),
  walletId: z.string().min(1),
  amount: z.number().int(),
  date: dateString,
  note: z.string().optional(),
  createdAt: timestamp,
});

export const backupSchema = z.object({
  app: z.literal("KLYRO"),
  exportedAt: timestamp,
  categories: z.array(category),
  transactions: z.array(transaction),
  budgets: z.array(budget),
  goals: z.array(goal),
  recurringPayments: z.array(recurringPayment).default([]),
  wallets: z.array(wallet).default([]),
  walletTransfers: z.array(walletTransfer).default([]),
  walletAdjustments: z.array(walletAdjustment).default([]),
  settings: z.array(z.object({ key: z.string().min(1), value: z.string() })),
});

export type BackupPayload = z.infer<typeof backupSchema>;

export function parseBackup(text: string): BackupPayload {
  const json: unknown = JSON.parse(text);
  return backupSchema.parse(json);
}
