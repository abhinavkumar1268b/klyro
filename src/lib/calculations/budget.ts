import type {
  Budget,
  BudgetPlan,
  BudgetProgress,
  RecurringPayment,
  Transaction,
} from "@/types";
import { getMonthKey } from "./format";

/** All budget formulas live here. UI components only render the results. */

export function spentForBudget(budget: Budget, transactions: Transaction[]): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.categoryId === budget.categoryId &&
        transaction.date.startsWith(budget.month),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
): BudgetProgress {
  const spent = spentForBudget(budget, transactions);
  return {
    budget,
    spent,
    remaining: remainingSpendingAllowance(budget.amount, spent),
    ratio: budget.amount === 0 ? 0 : spent / budget.amount,
  };
}

export function goalProgress(savedAmount: number, targetAmount: number): number {
  return targetAmount === 0 ? 0 : Math.min(savedAmount / targetAmount, 1);
}

export function remainingSpendingAllowance(allowance: number, recordedExpenses: number): number {
  return allowance - recordedExpenses;
}

export function budgetUsage(recordedExpenses: number, allowance: number): number {
  if (allowance <= 0) return recordedExpenses > 0 ? 100 : 0;
  return (recordedExpenses / allowance) * 100;
}

export function budgetExcess(recordedExpenses: number, allowance: number): number {
  return Math.max(0, recordedExpenses - allowance);
}

export function planAllocationTotal(plan: BudgetPlan): number {
  return plan.spendingAllowance + plan.protectedSavings;
}

export function planAllocationRemaining(plan: BudgetPlan): number {
  return plan.totalAvailable - planAllocationTotal(plan);
}

function dateForDay(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

/** Inclusive days left in the budget period. Past months return 0. */
export function daysLeftInPeriod(month: string, now: Date = new Date()): number {
  const currentMonth = getMonthKey(now);
  if (month < currentMonth) return 0;
  if (month > currentMonth) return daysInMonth(month);
  return Math.max(0, daysInMonth(month) - now.getDate() + 1);
}

/** Recurring items still due this month and not already recorded as expenses. */
export function upcomingRecurringTotal(
  plan: BudgetPlan,
  transactions: Transaction[],
  now: Date = new Date(),
  payments: RecurringPayment[] = [],
): number {
  if (plan.month !== getMonthKey(now)) return 0;

  const fromPayments = payments
    .filter((payment) => payment.nextDueDate.startsWith(plan.month))
    .map((payment) => ({
      label: payment.name,
      amount: payment.amount,
      dayOfMonth: Number(payment.nextDueDate.slice(-2)),
    }));

  const seen = new Set<string>();
  const items = [...plan.recurringExpenses, ...fromPayments].filter((item) => {
    const key = `${item.label}-${item.amount}-${item.dayOfMonth}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return items
    .filter((item) => {
      if (item.dayOfMonth < now.getDate() || item.dayOfMonth > daysInMonth(plan.month)) return false;
      const date = dateForDay(plan.month, item.dayOfMonth);
      return !transactions.some(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.date === date &&
          Math.abs(transaction.amount - item.amount) <= 1,
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);
}

export type SafeToSpendStatus =
  | "available"
  | "period-ended"
  | "over-budget"
  | "reserved-for-recurring";

export interface SafeToSpendResult {
  amount: number;
  status: SafeToSpendStatus;
  daysLeft: number;
  remaining: number;
  upcomingRecurring: number;
  explanation: string;
}

export function safeToSpendToday(
  plan: BudgetPlan,
  recordedExpenses: number,
  transactions: Transaction[],
  now: Date = new Date(),
  payments: RecurringPayment[] = [],
): SafeToSpendResult {
  const daysLeft = daysLeftInPeriod(plan.month, now);
  const remaining = remainingSpendingAllowance(plan.spendingAllowance, recordedExpenses);
  const upcomingRecurring = upcomingRecurringTotal(plan, transactions, now, payments);

  if (daysLeft <= 0) {
    return {
      amount: 0,
      status: "period-ended",
      daysLeft,
      remaining,
      upcomingRecurring,
      explanation: "This budget period has ended, so there is no daily allowance to calculate.",
    };
  }

  if (remaining <= 0) {
    return {
      amount: 0,
      status: "over-budget",
      daysLeft,
      remaining,
      upcomingRecurring,
      explanation: "Your recorded expenses have already used this month's spending allowance.",
    };
  }

  const afterRecurring = remaining - upcomingRecurring;
  if (afterRecurring <= 0) {
    return {
      amount: 0,
      status: "reserved-for-recurring",
      daysLeft,
      remaining,
      upcomingRecurring,
      explanation: "Upcoming recurring expenses have already claimed the rest of this month's allowance.",
    };
  }

  // Round down to a whole currency unit in minor units, never overstate the allowance.
  const amount = Math.floor(afterRecurring / daysLeft / 100) * 100;

  return {
    amount,
    status: "available",
    daysLeft,
    remaining,
    upcomingRecurring,
    explanation: `${afterRecurring} remaining across ${daysLeft} ${daysLeft === 1 ? "day" : "days"}, including today.`,
  };
}

export type BudgetAlertLevel = "none" | "warning" | "limit" | "over";

export interface BudgetAlert {
  level: BudgetAlertLevel;
  threshold: number | null;
}

export function budgetAlertLevel(usage: number, thresholds: number[]): BudgetAlert {
  if (usage > 100) return { level: "over", threshold: 100 };
  if (usage >= 100) return { level: "limit", threshold: 100 };

  const belowLimit = [...thresholds].filter((threshold) => threshold < 100).sort((a, b) => b - a);
  const matched = belowLimit.find((threshold) => usage >= threshold);
  return matched !== undefined
    ? { level: "warning", threshold: matched }
    : { level: "none", threshold: null };
}
