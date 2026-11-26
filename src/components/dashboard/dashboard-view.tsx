"use client";

import Link from "next/link";
import { Plus, Sparkles, Wallet } from "lucide-react";
import {
  useBudgetPlan,
  useCategories,
  useGoals,
  useRecurringPayments,
  useTransactions,
} from "@/hooks";
import { useCurrentDate, useMounted } from "@/hooks";
import { parseLocalDateKey } from "@/lib/date";
import { useDataStore } from "@/stores";
import { notify } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  budgetExcess,
  budgetUsage,
  expensesInMonth,
  filterByDateRange,
  formatMonth,
  getMonthKey,
  incomeInMonth,
  remainingSpendingAllowance,
  safeToSpendToday,
} from "@/lib/calculations";
import { AvailableToSpendCard } from "./available-to-spend-card";
import { BudgetProgressCard } from "./budget-progress-card";
import { DashboardHeader } from "./dashboard-header";
import { FinancialSummary } from "./financial-summary";
import { RecentTransactions } from "./recent-transactions";
import { SafeToSpendCard } from "./safe-to-spend-card";
import { SavingsGoalMini } from "./savings-goal-mini";
import { TrackingCard } from "./tracking-card";

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full max-w-md" />
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="space-y-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
        <Skeleton className="h-[36rem] rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: goals } = useGoals();
  const { data: categories } = useCategories();
  const { data: recurringPayments } = useRecurringPayments();
  const setMode = useDataStore((state) => state.setMode);
  const mounted = useMounted();
  const currentDate = useCurrentDate();
  const monthKey =
    mounted && currentDate ? currentDate.dateKey.slice(0, 7) : getMonthKey();
  const { data: plan, isLoading: planLoading } = useBudgetPlan(monthKey);

  if (isLoading || planLoading) return <LoadingDashboard />;

  const monthTransactions = filterByDateRange(transactions, { preset: "this-month" });
  const spent = expensesInMonth(transactions, monthKey);
  const income = incomeInMonth(transactions, monthKey);
  const tracking = !plan?.enabled;

  const remaining = plan?.enabled
    ? remainingSpendingAllowance(plan.spendingAllowance, spent)
    : income - spent;
  const availableToSpend = tracking ? Math.max(0, remaining) : remaining;
  const withinBudget = remaining >= 0;
  const excess = plan?.enabled ? budgetExcess(spent, plan.spendingAllowance) : 0;
  const usage = plan?.enabled ? budgetUsage(spent, plan.spendingAllowance) : 0;
  const protectedSavings = plan?.enabled ? plan.protectedSavings : 0;
  const safe = plan?.enabled
    ? safeToSpendToday(
        plan,
        spent,
        transactions,
        mounted && currentDate ? parseLocalDateKey(currentDate.dateKey) : new Date(),
        recurringPayments,
      )
    : null;
  const monthLabel = mounted ? formatMonth(monthKey) : "This month";

  function loadSamples() {
    setMode("demo");
    notify({ variant: "info", title: "Sample data is on", description: "Your own journal is untouched." });
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <AvailableToSpendCard
        amount={availableToSpend}
        budgetTotal={plan?.enabled ? plan.spendingAllowance : 0}
        withinBudget={withinBudget}
        fallbackFromIncome={tracking}
        excess={excess}
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Your journal is empty"
          description="Add your first entry to calculate a real spending allowance, or explore the screen with samples."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/add">
                  <Plus className="size-4" aria-hidden="true" />
                  Add entry
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={loadSamples}>
                <Sparkles className="size-4" aria-hidden="true" />
                Explore samples
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <FinancialSummary
            spent={spent}
            protectedSavings={protectedSavings}
            remainingBudget={remaining}
            transactionCount={monthTransactions.length}
            goalCount={goals.length}
            tracking={tracking}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div className="space-y-5">
              {plan?.enabled ? (
                <>
                  <BudgetProgressCard
                    monthLabel={monthLabel}
                    limit={plan.spendingAllowance}
                    spent={spent}
                    remaining={remaining}
                    percent={usage}
                  />
                  {safe ? <SafeToSpendCard result={safe} /> : null}
                </>
              ) : (
                <TrackingCard
                  month={monthKey}
                  transactions={transactions}
                  categories={categories}
                />
              )}
              <SavingsGoalMini goals={goals} />
            </div>

            <RecentTransactions transactions={transactions} categories={categories} />
          </div>
        </>
      )}
    </div>
  );
}
