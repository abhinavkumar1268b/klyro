import { describe, expect, it } from "vitest";
import { expensesInMonth, incomeInMonth, paymentMethodBreakdown } from "./transactions";
import type { Transaction } from "@/types";

const rupees = (value: number) => Math.round(value * 100);

function entry(
  type: Transaction["type"],
  amount: number,
  date: string,
  paymentMethod: string,
): Transaction {
  return {
    id: 1,
    type,
    amount: rupees(amount),
    categoryId: "food",
    title: "Test",
    date,
    paymentMethod,
    classification: type === "expense" ? "need" : undefined,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

const transactions = [
  entry("expense", 100, "2026-11-02", "UPI"),
  entry("expense", 250, "2026-11-15", "Credit Card"),
  entry("expense", 50, "2026-10-30", "Cash"),
  entry("income", 1000, "2026-11-01", "Bank Transfer"),
];

describe("monthly tracking", () => {
  it("sums only expenses in the requested month", () => {
    expect(expensesInMonth(transactions, "2026-11")).toBe(rupees(350));
    expect(expensesInMonth(transactions, "2026-10")).toBe(rupees(50));
    expect(expensesInMonth([], "2026-11")).toBe(0);
  });

  it("sums only income in the requested month", () => {
    expect(incomeInMonth(transactions, "2026-11")).toBe(rupees(1000));
    expect(incomeInMonth([], "2026-11")).toBe(0);
  });
});

describe("payment methods", () => {
  it("breaks down expenses by payment method and ignores income", () => {
    const result = paymentMethodBreakdown(transactions);
    expect(result).toEqual([
      { method: "Credit Card", total: rupees(250), count: 1 },
      { method: "UPI", total: rupees(100), count: 1 },
      { method: "Cash", total: rupees(50), count: 1 },
    ]);
  });

  it("defaults missing methods to Other", () => {
    const withoutMethod = { ...transactions[0], paymentMethod: undefined };
    expect(paymentMethodBreakdown([withoutMethod])[0].method).toBe("Other");
  });
});
