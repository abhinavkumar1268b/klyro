"use client";

import {
  useBudgetPlan,
  useCategories,
  useGoals,
  useRecurringPayments,
  useTransactions,
  useWalletAdjustments,
  useWalletTransfers,
  useWallets,
} from "@/hooks";
import { useCurrentDate, useMounted } from "@/hooks";
import { parseLocalDateKey } from "@/lib/date";
import { useDataStore } from "@/stores";
import { notify } from "@/stores/toast-store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  budgetUsage,
  dailyMoneyActivity,
  expensesInMonth,
  formatMonth,
  getMonthKey,
  incomeInMonth,
  remainingSpendingAllowance,
  safeToSpendToday,
  summarizeWallet,
  totalMoney,
} from "@/lib/calculations";
import { BudgetProgressCard } from "./budget-progress-card";
import { DashboardHeader } from "./dashboard-header";
import { FinancialSummary } from "./financial-summary";
import { SafeToSpendCard } from "./safe-to-spend-card";
import { SavingsGoalMini } from "./savings-goal-mini";
import { TodayMoneyActivity } from "./today-money-activity";
import { TotalMoneyCard } from "./total-money-card";
import { TrackingCard } from "./tracking-card";

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full max-w-md" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: goals } = useGoals();
  const { data: categories } = useCategories();
  const { data: recurringPayments } = useRecurringPayments();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: walletTransfers } = useWalletTransfers();
  const { data: walletAdjustments } = useWalletAdjustments();
  const setMode = useDataStore((state) => state.setMode);
  const mounted = useMounted();
  const currentDate = useCurrentDate();
  const monthKey =
    mounted && currentDate ? currentDate.dateKey.slice(0, 7) : getMonthKey();
  const todayKey = currentDate?.dateKey ?? getMonthKey();
  const { data: plan, isLoading: planLoading } = useBudgetPlan(monthKey);

  if (isLoading || planLoading || walletsLoading) return <LoadingDashboard />;

  const walletSummaries = wallets.map((wallet) =>
    summarizeWallet(wallet, transactions, walletTransfers, walletAdjustments),
  );
  const combinedMoney = totalMoney(walletSummaries);
  const activity = dailyMoneyActivity(transactions, todayKey);
  const monthTransactions = transactions.filter((item) => item.date.startsWith(monthKey));
  const spent = expensesInMonth(transactions, monthKey);
  const income = incomeInMonth(transactions, monthKey);
  const tracking = !plan?.enabled;
  const remaining = plan?.enabled
    ? remainingSpendingAllowance(plan.spendingAllowance, spent)
    : income - spent;
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
  const todayLabel = currentDate
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parseLocalDateKey(currentDate.dateKey))
    : "Today";

  function loadSamples() {
    setMode("demo");
    notify({ variant: "info", title: "Sample data is on", description: "Your own journal is untouched." });
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <TotalMoneyCard summaries={walletSummaries} total={combinedMoney} />

      <TodayMoneyActivity activity={activity} categories={categories} dateLabel={todayLabel} />

      <FinancialSummary
        spent={spent}
        protectedSavings={protectedSavings}
        remainingBudget={remaining}
        transactionCount={monthTransactions.length}
        goalCount={goals.length}
        tracking={tracking}
        onLoadSamples={loadSamples}
        showSamplesAction={transactions.length === 0}
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
      </div>
    </div>
  );
}
