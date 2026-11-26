"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getBudgetPlan, listBudgetPlans, listBudgets } from "@/features/budget";
import { listRecurringPayments } from "@/features/recurring";
import { listCategories } from "@/features/categories";
import { listGoals } from "@/features/goals";
import { listTransactions } from "@/features/transactions";
import { useDataStore } from "@/stores/data-store";
import { useDemoStore } from "@/stores/demo-store";
import type {
  Budget,
  BudgetPlan,
  Category,
  Goal,
  RecurringPayment,
  Transaction,
} from "@/types";

interface Collection<T> {
  data: T[];
  isLoading: boolean;
  isDemo: boolean;
}

/**
 * Demo mode reads the in-memory sample journal; live mode reads Dexie.
 * The two stores never mix, so samples can't leak into real storage.
 */
export function useTransactions(): Collection<Transaction> {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listTransactions());
  const demo = useDemoStore((state) => state.transactions);
  return {
    data: isDemo ? demo : (live ?? []),
    isLoading: !isDemo && live === undefined,
    isDemo,
  };
}

export function useCategories(): Collection<Category> {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listCategories());
  const demo = useDemoStore((state) => state.categories);
  return {
    data: isDemo ? demo : (live ?? []),
    isLoading: !isDemo && live === undefined,
    isDemo,
  };
}

export function useBudgets(): Collection<Budget> {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listBudgets());
  const demo = useDemoStore((state) => state.budgets);
  return {
    data: isDemo ? demo : (live ?? []),
    isLoading: !isDemo && live === undefined,
    isDemo,
  };
}

export function useGoals(): Collection<Goal> {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listGoals());
  const demo = useDemoStore((state) => state.goals);
  return {
    data: isDemo ? demo : (live ?? []),
    isLoading: !isDemo && live === undefined,
    isDemo,
  };
}

export function useBudgetPlan(month: string): { data: BudgetPlan | null; isLoading: boolean } {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => getBudgetPlan(month), [month]);
  const demo = useDemoStore((state) => state.budgetPlans[month] ?? null);
  return {
    data: isDemo ? demo : (live ?? null),
    isLoading: !isDemo && live === undefined,
  };
}

export function useBudgetPlans(): { data: Record<string, BudgetPlan>; isLoading: boolean } {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listBudgetPlans());
  const demo = useDemoStore((state) => state.budgetPlans);
  return {
    data: isDemo ? demo : (live ?? {}),
    isLoading: !isDemo && live === undefined,
  };
}

export function useRecurringPayments(): Collection<RecurringPayment> {
  const isDemo = useDataStore((state) => state.mode === "demo");
  const live = useLiveQuery(() => listRecurringPayments());
  const demo = useDemoStore((state) => state.recurringPayments);
  return {
    data: isDemo ? demo : (live ?? []),
    isLoading: !isDemo && live === undefined,
    isDemo,
  };
}
