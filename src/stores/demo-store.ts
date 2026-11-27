"use client";

import { create } from "zustand";
import { walletIdForPaymentMethod } from "@/constants/wallets";
import { toMinorUnits, todayISO } from "@/lib/calculations";
import { importMockData } from "@/lib/db/import";
import { createMockData } from "@/lib/mock/data";
import type {
  BudgetFormValues,
  GoalFormValues,
  RecurringPaymentFormValues,
  TransactionFormValues,
} from "@/lib/validation";
import type {
  Budget,
  BudgetPlan,
  Category,
  Goal,
  RecurringPayment,
  Transaction,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
} from "@/types";

interface DemoState {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  budgetPlans: Record<string, BudgetPlan>;
  recurringPayments: RecurringPayment[];
  wallets: Wallet[];
  walletTransfers: WalletTransfer[];
  walletAdjustments: WalletAdjustment[];
  setBudgetPlan: (plan: BudgetPlan) => void;
  updateWallet: (id: string, wallet: Wallet) => void;
  addWalletTransfer: (transfer: WalletTransfer) => void;
  addWalletAdjustment: (adjustment: WalletAdjustment) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Category) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (values: TransactionFormValues) => number;
  updateTransaction: (id: number, values: TransactionFormValues) => void;
  deleteTransaction: (id: number) => void;
  upsertBudget: (values: BudgetFormValues) => number;
  deleteBudget: (id: number) => void;
  addGoal: (values: GoalFormValues) => number;
  updateGoal: (id: number, values: GoalFormValues) => void;
  contributeToGoal: (id: number, amount: number, note?: string) => void;
  deleteGoal: (id: number) => void;
  addRecurringPayment: (values: RecurringPaymentFormValues) => number;
  updateRecurringPayment: (id: number, values: RecurringPaymentFormValues) => void;
  deleteRecurringPayment: (id: number) => void;
  resetDemo: () => void;
}

const seed = createMockData();
const now = () => new Date().toISOString();
const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
let transactionKey = 10000;
let budgetKey = 20000;
let goalKey = 30000;
let recurringKey = 40000;

function toTransaction(values: TransactionFormValues, id: number, createdAt: string): Transaction {
  return {
    id,
    type: values.type,
    amount: toMinorUnits(values.amount),
    categoryId: values.categoryId,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    date: values.date,
    paymentMethod: values.paymentMethod,
    walletId:
      values.type === "income" || values.type === "expense"
        ? (walletIdForPaymentMethod(values.paymentMethod) ?? undefined)
        : undefined,
    classification: values.type === "expense" ? values.classification : undefined,
    createdAt,
    updatedAt: now(),
  };
}

function toGoal(goalId: number, values: GoalFormValues, previous?: Goal): Goal {
  const savedAmount = toMinorUnits(values.savedAmount ?? 0);
  const contributions = [...(previous?.contributions ?? [])];
  if (previous && savedAmount !== previous.savedAmount) {
    contributions.push({
      id: newId("c"),
      amount: savedAmount - previous.savedAmount,
      date: todayISO(),
      note: "Balance adjustment",
      createdAt: now(),
    });
  } else if (!previous && savedAmount > 0) {
    contributions.push({
      id: newId("c"),
      amount: savedAmount,
      date: todayISO(),
      note: "Opening balance",
      createdAt: now(),
    });
  }

  return {
    id: goalId,
    name: values.name.trim(),
    targetAmount: toMinorUnits(values.targetAmount),
    savedAmount,
    deadline: values.deadline || undefined,
    icon: values.icon,
    tint: values.tint,
    contributions,
    createdAt: previous?.createdAt ?? now(),
    updatedAt: now(),
    completedAt:
      savedAmount >= toMinorUnits(values.targetAmount)
        ? previous?.completedAt ?? now()
        : undefined,
  };
}

/** In-memory sample journal. Never persisted, never written to IndexedDB. */
export const useDemoStore = create<DemoState>()((set) => ({
  categories: seed.categories,
  transactions: seed.transactions,
  budgets: seed.budgets,
  goals: seed.goals,
  budgetPlans: { [seed.budgetPlan.month]: seed.budgetPlan },
  recurringPayments: seed.recurringPayments,
  wallets: seed.wallets,
  walletTransfers: seed.walletTransfers,
  walletAdjustments: seed.walletAdjustments,

  setBudgetPlan: (plan) =>
    set((state) => ({ budgetPlans: { ...state.budgetPlans, [plan.month]: plan } })),

  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, category) =>
    set((state) => ({
      categories: state.categories.map((item) => (item.id === id ? category : item)),
    })),
  deleteCategory: (id) =>
    set((state) => ({ categories: state.categories.filter((item) => item.id !== id) })),

  addTransaction: (values) => {
    const id = transactionKey++;
    set((state) => ({
      transactions: [toTransaction(values, id, now()), ...state.transactions],
    }));
    return id;
  },
  updateTransaction: (id, values) =>
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id ? toTransaction(values, id, transaction.createdAt) : transaction,
      ),
    })),
  deleteTransaction: (id) =>
    set((state) => ({ transactions: state.transactions.filter((item) => item.id !== id) })),

  upsertBudget: (values) => {
    const id = budgetKey++;
    set((state) => {
      const existing = state.budgets.find(
        (budget) => budget.month === values.month && budget.categoryId === values.categoryId,
      );
      if (existing?.id !== undefined) {
        return {
          budgets: state.budgets.map((budget) =>
            budget.id === existing.id
              ? { ...budget, amount: toMinorUnits(values.amount), updatedAt: now() }
              : budget,
          ),
        };
      }
      return {
        budgets: [
          ...state.budgets,
          {
            id,
            categoryId: values.categoryId,
            month: values.month,
            amount: toMinorUnits(values.amount),
            createdAt: now(),
            updatedAt: now(),
          },
        ],
      };
    });
    return id;
  },
  deleteBudget: (id) =>
    set((state) => ({ budgets: state.budgets.filter((budget) => budget.id !== id) })),

  addGoal: (values) => {
    const id = goalKey++;
    set((state) => ({ goals: [toGoal(id, values), ...state.goals] }));
    return id;
  },
  updateGoal: (id, values) =>
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? toGoal(id, values, goal) : goal,
      ),
    })),
  contributeToGoal: (id, amount, note) =>
    set((state) => ({
      goals: state.goals.map((goal) => {
        if (goal.id !== id) return goal;
        const savedAmount = Math.max(0, goal.savedAmount + amount);
        return {
          ...goal,
          savedAmount,
          contributions: [
            ...goal.contributions,
            {
              id: newId("c"),
              amount,
              date: todayISO(),
              note,
              createdAt: now(),
            },
          ],
          updatedAt: now(),
          completedAt:
            savedAmount >= goal.targetAmount ? goal.completedAt ?? now() : undefined,
        };
      }),
    })),
  deleteGoal: (id) =>
    set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })),

  addRecurringPayment: (values) => {
    const id = recurringKey++;
    set((state) => ({
      recurringPayments: [
        ...state.recurringPayments,
        {
          id,
          name: values.name.trim(),
          amount: toMinorUnits(values.amount),
          categoryId: values.categoryId,
          frequency: values.frequency,
          nextDueDate: values.nextDueDate,
          reminderDays: values.reminderDays,
          autoRecord: values.autoRecord,
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    }));
    return id;
  },
  updateRecurringPayment: (id, values) =>
    set((state) => ({
      recurringPayments: state.recurringPayments.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              name: values.name.trim(),
              amount: toMinorUnits(values.amount),
              categoryId: values.categoryId,
              frequency: values.frequency,
              nextDueDate: values.nextDueDate,
              reminderDays: values.reminderDays,
              autoRecord: values.autoRecord,
              updatedAt: now(),
            }
          : payment,
      ),
    })),
  deleteRecurringPayment: (id) =>
    set((state) => ({
      recurringPayments: state.recurringPayments.filter((payment) => payment.id !== id),
    })),

  updateWallet: (id, wallet) =>
    set((state) => ({
      wallets: state.wallets.map((item) => (item.id === id ? wallet : item)),
    })),
  addWalletTransfer: (transfer) =>
    set((state) => ({ walletTransfers: [transfer, ...state.walletTransfers] })),
  addWalletAdjustment: (adjustment) =>
    set((state) => ({ walletAdjustments: [adjustment, ...state.walletAdjustments] })),

  resetDemo: () =>
    set(() => {
      const fresh = createMockData();
      return {
        categories: fresh.categories,
        transactions: fresh.transactions,
        budgets: fresh.budgets,
        goals: fresh.goals,
        budgetPlans: { [fresh.budgetPlan.month]: fresh.budgetPlan },
        recurringPayments: fresh.recurringPayments,
        wallets: fresh.wallets,
        walletTransfers: fresh.walletTransfers,
        walletAdjustments: fresh.walletAdjustments,
      };
    }),
}));

/** Explicit, user-triggered copy of samples into the real local journal. */
export function importDemoIntoLive(): Promise<void> {
  return importMockData(seed);
}
