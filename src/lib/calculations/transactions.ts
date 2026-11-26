import type {
  CashflowSummary,
  CategoryTotal,
  DateRange,
  Transaction,
  TransactionType,
} from "@/types";
import { getMonthKey } from "./format";

/** Income, expense, net and count for a set of transactions (minor units). */
export function summarizeCashflow(transactions: Transaction[]): CashflowSummary {
  const result = transactions.reduce<CashflowSummary>(
    (summary, transaction) => {
      if (transaction.type === "income") summary.income += transaction.amount;
      else summary.expense += transaction.amount;
      summary.count += 1;
      return summary;
    },
    { income: 0, expense: 0, net: 0, count: 0 },
  );

  result.net = result.income - result.expense;
  return result;
}

/** Total expenses recorded inside a `YYYY-MM` period. */
export function expensesInMonth(transactions: Transaction[], month: string): number {
  return transactions
    .filter((transaction) => transaction.type === "expense" && transaction.date.startsWith(month))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

/** Total income recorded inside a `YYYY-MM` period. */
export function incomeInMonth(transactions: Transaction[], month: string): number {
  return transactions
    .filter((transaction) => transaction.type === "income" && transaction.date.startsWith(month))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export interface PaymentMethodTotal {
  method: string;
  total: number;
  count: number;
}

/** Payment-method breakdown used when budgeting is switched off. */
export function paymentMethodBreakdown(transactions: Transaction[]): PaymentMethodTotal[] {
  const buckets = new Map<string, PaymentMethodTotal>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const method = transaction.paymentMethod ?? "Other";
    const bucket = buckets.get(method) ?? { method, total: 0, count: 0 };
    bucket.total += transaction.amount;
    bucket.count += 1;
    buckets.set(method, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.total - a.total);
}

export function filterByType(
  transactions: Transaction[],
  type: TransactionType | "all",
): Transaction[] {
  return type === "all"
    ? transactions
    : transactions.filter((transaction) => transaction.type === type);
}

/** Resolve a preset or explicit date range into inclusive date bounds. */
export function resolveDateRange(range: DateRange): { from?: string; to?: string } {
  const now = new Date();
  const month = getMonthKey(now);
  const [year, monthNumber] = month.split("-").map(Number);
  const startOfMonth = `${month}-01`;
  const endOfMonth = `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;

  switch (range.preset) {
    case "this-month":
      return { from: startOfMonth, to: endOfMonth };
    case "last-month": {
      const lastMonth = new Date(year, monthNumber - 2, 1);
      const from = getMonthKey(lastMonth);
      const to = `${from}-${String(
        new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate(),
      ).padStart(2, "0")}`;
      return { from, to };
    }
    case "last-3-months": {
      const from = getMonthKey(new Date(year, monthNumber - 3, 1));
      return { from: `${from}-01`, to: endOfMonth };
    }
    case "this-year":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "custom":
      return { from: range.from, to: range.to };
    case "all-time":
    default:
      return {};
  }
}

export function filterByDateRange(
  transactions: Transaction[],
  range: DateRange,
): Transaction[] {
  const { from, to } = resolveDateRange(range);
  return transactions.filter(
    (transaction) => (!from || transaction.date >= from) && (!to || transaction.date <= to),
  );
}

/** Rank categories by spend, with each category's share of total spend. */
export function totalsByCategory(
  transactions: Transaction[],
  type: TransactionType = "expense",
): CategoryTotal[] {
  const scoped = transactions.filter((transaction) => transaction.type === type);
  const total = scoped.reduce((sum, transaction) => sum + transaction.amount, 0);
  const buckets = new Map<string, { total: number; count: number }>();

  for (const transaction of scoped) {
    const bucket = buckets.get(transaction.categoryId) ?? { total: 0, count: 0 };
    bucket.total += transaction.amount;
    bucket.count += 1;
    buckets.set(transaction.categoryId, bucket);
  }

  return [...buckets.entries()]
    .map(([categoryId, bucket]) => ({
      categoryId,
      total: bucket.total,
      count: bucket.count,
      percentage: total === 0 ? 0 : (bucket.total / total) * 100,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Month-keyed income/expense series, ready for Recharts. */
export function monthlyCashflow(transactions: Transaction[], months = 6) {
  const now = new Date();
  const keys = Array.from({ length: months }, (_, index) =>
    getMonthKey(new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1)),
  );

  return keys.map((month) => {
    const inMonth = transactions.filter((transaction) => getMonthKey(transaction.date) === month);
    const summary = summarizeCashflow(inMonth);
    return { month, income: summary.income, expense: summary.expense };
  });
}
