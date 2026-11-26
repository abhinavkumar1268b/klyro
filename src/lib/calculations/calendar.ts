import type { Transaction } from "@/types";
import { getMonthKey, isoDate } from "./format";

/** Levels are derived from the selected month's own spending distribution. */
export type SpendingLevel = "zero" | "low" | "medium" | "high";

export interface CalendarDay {
  /** `YYYY-MM-DD`, or null for an empty leading/trailing cell. */
  date: string | null;
  day: number | null;
  inMonth: boolean;
  expenses: number;
  income: number;
  count: number;
  transactions: Transaction[];
  level: SpendingLevel;
  isToday: boolean;
}

export interface MonthlyCalendar {
  month: string;
  weeks: CalendarDay[][];
  days: CalendarDay[];
  totalExpenses: number;
  totalIncome: number;
  activeDays: number;
  peakExpense: number;
}

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const CALENDAR_WEEKDAYS = WEEKDAY_LABELS;

export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return getMonthKey(date);
}

function levelFor(amount: number, lowCutoff: number, mediumCutoff: number): SpendingLevel {
  if (amount <= 0) return "zero";
  if (amount <= lowCutoff) return "low";
  if (amount <= mediumCutoff) return "medium";
  return "high";
}

/** Builds a Sunday-first month grid using local calendar dates only. */
export function buildMonthlyCalendar(
  transactions: Transaction[],
  month: string,
  today: Date = new Date(),
): MonthlyCalendar {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const todayKey = isoDate(today);

  const byDate = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (!transaction.date.startsWith(month)) continue;
    const existing = byDate.get(transaction.date) ?? [];
    existing.push(transaction);
    byDate.set(transaction.date, existing);
  }

  const amounts = [...byDate.values()]
    .map((items) =>
      items
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    )
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  // Tertiles of this month's non-zero days — no hardcoded currency thresholds.
  const lowCutoff = amounts.length >= 3 ? amounts[Math.floor((amounts.length - 1) / 3)] : amounts[0] ?? 0;
  const mediumCutoff =
    amounts.length >= 3 ? amounts[Math.floor(((amounts.length - 1) * 2) / 3)] : (amounts[1] ?? amounts[0] ?? 0);

  const makeDay = (day: number | null): CalendarDay => {
    if (day === null) {
      return {
        date: null,
        day: null,
        inMonth: false,
        expenses: 0,
        income: 0,
        count: 0,
        transactions: [],
        level: "zero",
        isToday: false,
      };
    }
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const items = byDate.get(date) ?? [];
    const expenses = items
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const income = items
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      date,
      day,
      inMonth: true,
      expenses,
      income,
      count: items.length,
      transactions: items,
      level: levelFor(expenses, lowCutoff, mediumCutoff),
      isToday: date === todayKey,
    };
  };

  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstWeekday + 1;
    return makeDay(day >= 1 && day <= daysInMonth ? day : null);
  });
  const weeks = Array.from({ length: totalCells / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return {
    month,
    weeks,
    days,
    totalExpenses: amounts.reduce((sum, amount) => sum + amount, 0),
    totalIncome: days.reduce((sum, day) => sum + day.income, 0),
    activeDays: amounts.length,
    peakExpense: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
  };
}
