import type { BudgetPlan, CategoryTotal, Goal, Transaction } from "@/types";
import { budgetExcess, goalProgress, remainingSpendingAllowance } from "./budget";
import { formatCurrency, isoDate } from "./format";
import { expensesInMonth, summarizeCashflow, totalsByCategory } from "./transactions";
import { useSettingsStore } from "@/stores/settings-store";

/** All insight analysis lives here; views only render the results. */

export type InsightMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export interface InsightRange {
  mode: InsightMode;
  from: string;
  to: string;
  label: string;
  previousFrom: string;
  previousTo: string;
  previousLabel: string;
}

export interface Comparison {
  current: number;
  previous: number;
  delta: number;
  percentChange: number | null;
  hasPrevious: boolean;
}

export interface CategoryAnalysis extends CategoryTotal {
  previousTotal: number;
  comparison: Comparison;
}

export type PaymentGroup = "Cash" | "UPI" | "Card" | "Bank transfer" | "Other";

export interface PaymentBreakdown {
  group: PaymentGroup;
  total: number;
  count: number;
  percentage: number;
}

export interface NeedWantBreakdown {
  need: number;
  want: number;
  needCount: number;
  wantCount: number;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  amount: number;
}

export interface WeeklyStats {
  total: number;
  dailyAverage: number;
  highestDay: { date: string; label: string; amount: number } | null;
  highestCategoryId: string | null;
  comparison: Comparison;
}

export interface WeeklyReview {
  total: number;
  biggestExpense: Transaction | null;
  highestCategoryId: string | null;
  dailyAverage: number;
  budgetRemaining: number | null;
  comparison: Comparison;
}

export interface MonthStats {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface InsightAnalysis {
  range: InsightRange;
  transactions: Transaction[];
  summary: ReturnType<typeof summarizeCashflow>;
  previousSummary: ReturnType<typeof summarizeCashflow>;
  categories: CategoryAnalysis[];
  payments: PaymentBreakdown[];
  needWant: NeedWantBreakdown;
  previousNeedWant: NeedWantBreakdown;
  weeklyReview: WeeklyReview;
  trend: DailyTrendPoint[];
  weekly: WeeklyStats;
  months: MonthStats[];
  insights: string[];
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const sundayStart = useSettingsStore.getState().weekStartsOn === "sunday";
  const weekday = sundayStart ? copy.getDay() : (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - weekday);
  return copy;
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
}

function fullDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
}

export function rangeForMode(
  mode: InsightMode,
  anchor: Date = new Date(),
  custom?: { from?: string; to?: string },
): InsightRange {
  let from: Date;
  let to: Date;
  let previousFrom: Date;
  let previousTo: Date;
  let label: string;
  let previousLabel: string;

  switch (mode) {
    case "daily": {
      from = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
      to = from;
      previousFrom = new Date(from);
      previousFrom.setDate(from.getDate() - 1);
      previousTo = previousFrom;
      label = fullDate(from);
      previousLabel = fullDate(previousFrom);
      break;
    }
    case "weekly": {
      from = startOfWeek(anchor);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      previousTo = new Date(from);
      previousTo.setDate(from.getDate() - 1);
      previousFrom = new Date(previousTo);
      previousFrom.setDate(previousTo.getDate() - 6);
      label = `${shortDate(from)} – ${fullDate(to)}`;
      previousLabel = `${shortDate(previousFrom)} – ${fullDate(previousTo)}`;
      break;
    }
    case "monthly": {
      from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      to = endOfMonth(anchor);
      previousTo = new Date(anchor.getFullYear(), anchor.getMonth(), 0);
      previousFrom = new Date(previousTo.getFullYear(), previousTo.getMonth(), 1);
      label = monthLabel(anchor);
      previousLabel = monthLabel(previousFrom);
      break;
    }
    case "yearly": {
      from = new Date(anchor.getFullYear(), 0, 1);
      to = new Date(anchor.getFullYear(), 11, 31);
      previousFrom = new Date(anchor.getFullYear() - 1, 0, 1);
      previousTo = new Date(anchor.getFullYear() - 1, 11, 31);
      label = String(anchor.getFullYear());
      previousLabel = String(anchor.getFullYear() - 1);
      break;
    }
    case "custom": {
      from = new Date(`${custom?.from ?? isoDate(anchor)}T00:00:00`);
      to = new Date(`${custom?.to ?? isoDate(anchor)}T00:00:00`);
      const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
      previousTo = new Date(from);
      previousTo.setDate(from.getDate() - 1);
      previousFrom = new Date(previousTo);
      previousFrom.setDate(previousTo.getDate() - days + 1);
      label = `${shortDate(from)} – ${fullDate(to)}`;
      previousLabel = `${shortDate(previousFrom)} – ${fullDate(previousTo)}`;
      break;
    }
  }

  return {
    mode,
    from: isoDate(from),
    to: isoDate(to),
    label,
    previousFrom: isoDate(previousFrom),
    previousTo: isoDate(previousTo),
    previousLabel,
  };
}

export function transactionsInRange(transactions: Transaction[], from: string, to: string): Transaction[] {
  return transactions.filter((transaction) => transaction.date >= from && transaction.date <= to);
}

/** Never returns a percentage when the previous period has zero or missing data. */
export function makeComparison(current: number, previous: number): Comparison {
  return {
    current,
    previous,
    delta: current - previous,
    percentChange: previous > 0 ? ((current - previous) / previous) * 100 : null,
    hasPrevious: previous > 0,
  };
}

export function paymentGroup(method?: string): PaymentGroup {
  switch (method) {
    case "Cash":
      return "Cash";
    case "UPI":
      return "UPI";
    case "Debit Card":
    case "Credit Card":
      return "Card";
    case "Bank Transfer":
      return "Bank transfer";
    default:
      return "Other";
  }
}

export function paymentBreakdown(transactions: Transaction[]): PaymentBreakdown[] {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const buckets = new Map<PaymentGroup, { total: number; count: number }>();

  for (const transaction of expenses) {
    const group = paymentGroup(transaction.paymentMethod);
    const bucket = buckets.get(group) ?? { total: 0, count: 0 };
    bucket.total += transaction.amount;
    bucket.count += 1;
    buckets.set(group, bucket);
  }

  return (["Cash", "UPI", "Card", "Bank transfer", "Other"] as PaymentGroup[])
    .map((group) => {
      const bucket = buckets.get(group) ?? { total: 0, count: 0 };
      return {
        group,
        total: bucket.total,
        count: bucket.count,
        percentage: total === 0 ? 0 : (bucket.total / total) * 100,
      };
    })
    .filter((item) => item.count > 0);
}

export function needWantBreakdown(transactions: Transaction[]): NeedWantBreakdown {
  const result: NeedWantBreakdown = { need: 0, want: 0, needCount: 0, wantCount: 0 };
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || !transaction.classification) continue;
    if (transaction.classification === "want") {
      result.want += transaction.amount;
      result.wantCount += 1;
    } else {
      result.need += transaction.amount;
      result.needCount += 1;
    }
  }
  return result;
}

export function dailyTrend(transactions: Transaction[], from: string, to: string): DailyTrendPoint[] {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const daily = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    daily.set(transaction.date, (daily.get(transaction.date) ?? 0) + transaction.amount);
  }

  const points: DailyTrendPoint[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = isoDate(cursor);
    points.push({
      date,
      label: shortDate(cursor),
      amount: daily.get(date) ?? 0,
    });
    if (points.length >= 400) break;
  }
  return points;
}

function weeklyStats(
  current: Transaction[],
  previous: Transaction[],
  categories: CategoryTotal[],
  from: string,
  to: string,
): WeeklyStats {
  const total = current
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const previousTotal = previous
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const daily = dailyTrend(current, from, to);
  const highest = daily.reduce<DailyTrendPoint | null>(
    (best, point) => (!best || point.amount > best.amount ? point : best),
    null,
  );

  return {
    total,
    dailyAverage: total / 7,
    highestDay: highest && highest.amount > 0
      ? {
          date: highest.date,
          label: new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(
            new Date(`${highest.date}T00:00:00`),
          ),
          amount: highest.amount,
        }
      : null,
    highestCategoryId: categories.length > 0 ? categories[0].categoryId : null,
    comparison: makeComparison(total, previousTotal),
  };
}

export function yearlyMonths(transactions: Transaction[], year: number): MonthStats[] {
  return Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const summary = summarizeCashflow(
      transactions.filter((transaction) => transaction.date.startsWith(key)),
    );
    return {
      key,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
        new Date(year, index, 1),
      ),
      income: summary.income,
      expense: summary.expense,
      net: summary.net,
    };
  });
}

function buildInsightStatements(
  analysis: Pick<
    InsightAnalysis,
    | "range"
    | "summary"
    | "previousSummary"
    | "categories"
    | "payments"
    | "needWant"
    | "weekly"
    | "weeklyReview"
  >,
  categories: Array<{ id: string; name: string }>,
  goals: Goal[],
): string[] {
  const statements: string[] = [];
  const periodWord = analysis.range.mode === "monthly" ? "this month" : "in this period";
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;

  if (analysis.categories.length > 0) {
    const top = analysis.categories[0];
    statements.push(
      `You spent ${formatCurrency(top.total)} on ${nameFor(top.categoryId)} ${periodWord}.`,
    );
    if (top.comparison.percentChange !== null) {
      const direction = top.comparison.percentChange >= 0 ? "increased" : "decreased";
      statements.push(
        `Your ${nameFor(top.categoryId)} spending ${direction} ${Math.round(
          Math.abs(top.comparison.percentChange),
        )}% compared to ${analysis.range.previousLabel.toLowerCase()}.`,
      );
    }
  }

  if (analysis.weeklyReview.biggestExpense) {
    statements.push(
      `Your biggest expense was ${formatCurrency(
        analysis.weeklyReview.biggestExpense.amount,
      )} on ${analysis.weeklyReview.biggestExpense.title}.`,
    );
  }

  if (analysis.weekly.highestDay) {
    statements.push(
      `${analysis.weekly.highestDay.label} was your highest spending day (${formatCurrency(
        analysis.weekly.highestDay.amount,
      )}).`,
    );
  }

  const shopping = analysis.categories.find((item) => nameFor(item.categoryId).toLowerCase() === "shopping");
  if (shopping?.comparison.hasPrevious) {
    const direction = shopping.comparison.delta >= 0 ? "more" : "less";
    statements.push(
      `You spent ${formatCurrency(Math.abs(shopping.comparison.delta))} ${direction} on Shopping than ${analysis.range.previousLabel.toLowerCase()}.`,
    );
  }

  if (analysis.payments.length > 0) {
    const topPayment = analysis.payments[0];
    statements.push(
      `${topPayment.group} accounted for ${Math.round(topPayment.percentage)}% of your spending.`,
    );
  }

  const classified = analysis.needWant.need + analysis.needWant.want;
  if (classified > 0) {
    statements.push(
      `Needs made up ${Math.round((analysis.needWant.need / classified) * 100)}% of your classified spending.`,
    );
  }

  const excess = budgetExcess(analysis.summary.expense, analysis.summary.income);
  if (analysis.summary.income > 0 && excess > 0) {
    statements.push(
      `Spending exceeded income by ${formatCurrency(excess)} ${periodWord}.`,
    );
  }

  const closestGoal = [...goals]
    .filter((goal) => goal.targetAmount > 0)
    .sort((a, b) => goalProgress(b.savedAmount, b.targetAmount) - goalProgress(a.savedAmount, a.targetAmount))[0];
  if (closestGoal) {
    statements.push(
      `Your ${closestGoal.name} goal is ${Math.round(
        goalProgress(closestGoal.savedAmount, closestGoal.targetAmount) * 100,
      )}% complete.`,
    );
  }

  return statements.slice(0, 6);
}

export function analyzeInsights(
  transactions: Transaction[],
  options: {
    mode: InsightMode;
    anchor?: Date;
    custom?: { from?: string; to?: string };
    categories?: Array<{ id: string; name: string }>;
    goals?: Goal[];
    plan?: BudgetPlan | null;
  },
): InsightAnalysis {
  const anchor = options.anchor ?? new Date();
  const range = rangeForMode(options.mode, anchor, options.custom);
  const current = transactionsInRange(transactions, range.from, range.to);
  const previous = transactionsInRange(transactions, range.previousFrom, range.previousTo);

  const summary = summarizeCashflow(current);
  const previousSummary = summarizeCashflow(previous);
  const currentTotals = totalsByCategory(current);
  const previousTotals = new Map(
    totalsByCategory(previous).map((item) => [item.categoryId, item.total]),
  );

  const categories: CategoryAnalysis[] = currentTotals.map((item) => {
    const previousTotal = previousTotals.get(item.categoryId) ?? 0;
    return { ...item, previousTotal, comparison: makeComparison(item.total, previousTotal) };
  });

  const expenses = current.filter((transaction) => transaction.type === "expense");
  const biggestExpense = expenses.reduce<Transaction | null>(
    (biggest, transaction) => (!biggest || transaction.amount > biggest.amount ? transaction : biggest),
    null,
  );
  const needWant = needWantBreakdown(current);
  const previousNeedWant = needWantBreakdown(previous);

  const analysis = {
    range,
    transactions: current,
    summary,
    previousSummary,
    categories,
    payments: paymentBreakdown(current),
    needWant,
    previousNeedWant,
    weeklyReview: {
      total: summary.expense,
      biggestExpense,
      highestCategoryId: currentTotals.length > 0 ? currentTotals[0].categoryId : null,
      dailyAverage: summary.expense / 7,
      budgetRemaining:
        options.plan?.enabled && options.plan
          ? remainingSpendingAllowance(
              options.plan.spendingAllowance,
              expensesInMonth(transactions, options.plan.month),
            )
          : null,
      comparison: makeComparison(summary.expense, previousSummary.expense),
    },
    trend: range.mode === "yearly" ? [] : dailyTrend(current, range.from, range.to),
    weekly: weeklyStats(current, previous, currentTotals, range.from, range.to),
    months: yearlyMonths(transactions, anchor.getFullYear()),
    insights: [] as string[],
  };

  analysis.insights = buildInsightStatements(
    analysis,
    options.categories ?? [],
    options.goals ?? [],
  );
  return analysis;
}
