import { afterEach, describe, expect, it } from "vitest";
import { buildMonthlyCalendar } from "./calculations/calendar";
import { expensesInMonth, incomeInMonth } from "./calculations/transactions";
import { localDateKeyFromTimestamp } from "./date";
import type { Transaction } from "@/types";

const originalTZ = process.env.TZ;
const rupees = (value: number) => Math.round(value * 100);

function entry(date: string, amount: number, type: Transaction["type"]): Transaction {
  return {
    id: 1,
    type,
    amount: rupees(amount),
    categoryId: "food",
    title: "Boundary transaction",
    date,
    paymentMethod: "UPI",
    createdAt: "2026-11-26T18:30:00.000Z",
    updatedAt: "2026-11-26T18:30:00.000Z",
  };
}

afterEach(() => {
  process.env.TZ = originalTZ;
});

describe("transactions near midnight across timezones", () => {
  const timezones = [
    "Asia/Kolkata",
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
  ];

  for (const timezone of timezones) {
    it(`assigns the correct local calendar date in ${timezone}`, () => {
      process.env.TZ = timezone;
      const timestamp = "2026-11-26T18:30:00.000Z";
      const dateKey = localDateKeyFromTimestamp(timestamp);
      const expense = entry(dateKey, 100, "expense");
      const income = entry(dateKey, 500, "income");

      const month = dateKey.slice(0, 7);
      expect(expensesInMonth([expense], month)).toBe(rupees(100));
      expect(incomeInMonth([income], month)).toBe(rupees(500));

      const calendar = buildMonthlyCalendar([expense, income], month);
      const day = calendar.days.find((item) => item.date === dateKey)!;
      expect(day.expenses).toBe(rupees(100));
      expect(day.income).toBe(rupees(500));
      expect(day.count).toBe(2);
      expect(calendar.totalExpenses).toBe(rupees(100));
    });
  }
});
