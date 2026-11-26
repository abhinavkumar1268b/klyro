import type {
  BudgetPlan,
  Goal,
  RecurringPayment,
  RecurrenceFrequency,
  Transaction,
} from "@/types";
import { daysInMonth } from "./budget";
import { getMonthKey, isoDate } from "./format";
import { expensesInMonth } from "./transactions";
import { goalProgress } from "./budget";

/** Consecutive days ending today (or yesterday) with a recorded expense. */
export function trackingStreak(transactions: Transaction[], now: Date = new Date()): number {
  const days = new Set(
    transactions.filter((transaction) => transaction.type === "expense").map((item) => item.date),
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface AllowanceDays {
  count: number;
  elapsedDays: number;
  dailyAllowance: number;
}

/** Days this month with recorded spending that stayed inside the daily share of the allowance. */
export function daysWithinAllowance(
  plan: BudgetPlan,
  transactions: Transaction[],
  now: Date = new Date(),
): AllowanceDays {
  const month = getMonthKey(now);
  if (!plan.enabled || plan.month !== month || plan.spendingAllowance <= 0) {
    return { count: 0, elapsedDays: 0, dailyAllowance: 0 };
  }

  const totalDays = daysInMonth(month);
  const dailyAllowance = Math.floor(plan.spendingAllowance / totalDays / 100) * 100;
  const daily = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || !transaction.date.startsWith(month)) continue;
    daily.set(transaction.date, (daily.get(transaction.date) ?? 0) + transaction.amount);
  }

  const elapsedDays = now.getDate();
  let count = 0;
  for (let day = 1; day <= elapsedDays; day += 1) {
    const spent = daily.get(`${month}-${String(day).padStart(2, "0")}`);
    if (spent !== undefined && spent <= dailyAllowance) count += 1;
  }
  return { count, elapsedDays, dailyAllowance };
}

export interface GoalMilestones {
  total: number;
  completed: number;
  nearest: Goal | null;
  nearestProgress: number;
}

export function goalMilestones(goals: Goal[]): GoalMilestones {
  const withTargets = goals.filter((goal) => goal.targetAmount > 0);
  const completed = withTargets.filter(
    (goal) => goal.completedAt || goalProgress(goal.savedAmount, goal.targetAmount) >= 1,
  ).length;
  const nearest = [...withTargets].sort(
    (a, b) => goalProgress(b.savedAmount, b.targetAmount) - goalProgress(a.savedAmount, a.targetAmount),
  )[0];

  return {
    total: withTargets.length,
    completed,
    nearest: nearest ?? null,
    nearestProgress: nearest ? goalProgress(nearest.savedAmount, nearest.targetAmount) : 0,
  };
}

/** Completed or in-progress months whose spending stayed inside their allowance. */
export function monthsWithinBudget(
  plans: Record<string, BudgetPlan>,
  transactions: Transaction[],
  now: Date = new Date(),
): number {
  const currentMonth = getMonthKey(now);
  return Object.values(plans).filter((plan) => {
    if (!plan.enabled || plan.month > currentMonth || plan.spendingAllowance <= 0) return false;
    return expensesInMonth(transactions, plan.month) <= plan.spendingAllowance;
  }).length;
}

export function advanceDueDate(date: string, frequency: RecurrenceFrequency): string {
  const [year, month, day] = date.split("-").map(Number);
  if (frequency === "weekly") {
    const next = new Date(year, month - 1, day + 7);
    return isoDate(next);
  }
  if (frequency === "monthly") {
    const targetMonth = new Date(year, month, 1); // zero-based index => next month
    const lastDay = daysInMonth(
      `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`,
    );
    return isoDate(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(day, lastDay)));
  }
  return isoDate(new Date(year + 1, month - 1, Math.min(day, daysInMonth(`${year + 1}-${String(month).padStart(2, "0")}`))));
}

export function daysUntilDue(payment: RecurringPayment, now: Date = new Date()): number {
  const due = new Date(`${payment.nextDueDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function isReminderActive(payment: RecurringPayment, now: Date = new Date()): boolean {
  const days = daysUntilDue(payment, now);
  return days <= payment.reminderDays && days >= 0;
}
