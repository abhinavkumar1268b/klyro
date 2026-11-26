import { describe, expect, it } from "vitest";
import {
  budgetAlertLevel,
  budgetExcess,
  budgetUsage,
  daysLeftInPeriod,
  planAllocationRemaining,
  planAllocationTotal,
  remainingSpendingAllowance,
  safeToSpendToday,
  upcomingRecurringTotal,
} from "./budget";
import type { BudgetPlan, Transaction } from "@/types";

const NOW = new Date(2026, 10, 26); // 26 November 2026
const rupees = (value: number) => Math.round(value * 100);

function plan(overrides: Partial<BudgetPlan> = {}): BudgetPlan {
  return {
    month: "2026-11",
    enabled: true,
    totalAvailable: rupees(10000),
    spendingAllowance: rupees(7000),
    protectedSavings: rupees(3000),
    thresholds: [80, 90, 100],
    recurringExpenses: [
      { id: "r1", label: "Monthly top-up", amount: rupees(800), dayOfMonth: 28, categoryId: "groceries" },
    ],
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function transaction(date: string, amount: number, title = "Expense"): Transaction {
  return {
    id: 1,
    type: "expense",
    amount: rupees(amount),
    categoryId: "food",
    title,
    date,
    paymentMethod: "UPI",
    classification: "need",
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe("allowance", () => {
  it("subtracts recorded expenses from the allowance", () => {
    expect(remainingSpendingAllowance(rupees(7000), rupees(2500))).toBe(rupees(4500));
  });

  it("returns a negative allowance when spending is over the plan", () => {
    expect(remainingSpendingAllowance(rupees(7000), rupees(7500))).toBe(-rupees(500));
  });

  it("computes usage and excess including zero-value edge cases", () => {
    expect(budgetUsage(rupees(1750), rupees(7000))).toBe(25);
    expect(budgetUsage(0, 0)).toBe(0);
    expect(budgetUsage(rupees(100), 0)).toBe(100);
    expect(budgetExcess(rupees(7500), rupees(7000))).toBe(rupees(500));
    expect(budgetExcess(rupees(1000), rupees(7000))).toBe(0);
  });

  it("checks that allocations fit the total available money", () => {
    const example = plan();
    expect(planAllocationTotal(example)).toBe(rupees(10000));
    expect(planAllocationRemaining(example)).toBe(0);
    expect(planAllocationRemaining(plan({ protectedSavings: rupees(4000) }))).toBe(-rupees(1000));
  });
});

describe("period and recurring expenses", () => {
  it("counts days left in the current month inclusively", () => {
    expect(daysLeftInPeriod("2026-11", NOW)).toBe(5);
    expect(daysLeftInPeriod("2026-10", NOW)).toBe(0);
    expect(daysLeftInPeriod("2026-12", NOW)).toBe(31);
  });

  it("reserves only unpaid recurring items still due this month", () => {
    expect(upcomingRecurringTotal(plan(), [], NOW)).toBe(rupees(800));
    expect(upcomingRecurringTotal(plan({ month: "2026-10" }), [], NOW)).toBe(0);
    expect(
      upcomingRecurringTotal(plan({ recurringExpenses: [] }), [], NOW),
    ).toBe(0);
  });

  it("does not double-count a recurring item already recorded", () => {
    const recorded = [transaction("2026-11-28", 800, "Monthly top-up")];
    expect(upcomingRecurringTotal(plan(), recorded, NOW)).toBe(0);
  });
});

describe("safe to spend today", () => {
  it("spreads the remaining allowance after recurring reservations over the days left", () => {
    const result = safeToSpendToday(plan(), rupees(1000), [], NOW);
    expect(result.status).toBe("available");
    expect(result.daysLeft).toBe(5);
    expect(result.upcomingRecurring).toBe(rupees(800));
    expect(result.amount).toBe(rupees(1040));
  });

  it("never reports a positive amount when the allowance is exceeded", () => {
    const result = safeToSpendToday(plan(), rupees(7500), [], NOW);
    expect(result.status).toBe("over-budget");
    expect(result.amount).toBe(0);
    expect(result.explanation).toContain("allowance");
  });

  it("explains when the budget period has ended", () => {
    const result = safeToSpendToday(plan({ month: "2026-10" }), rupees(1000), [], NOW);
    expect(result.status).toBe("period-ended");
    expect(result.amount).toBe(0);
  });

  it("explains when recurring expenses consume the rest of the allowance", () => {
    const result = safeToSpendToday(plan({ spendingAllowance: rupees(700) }), rupees(100), [], NOW);
    expect(result.status).toBe("reserved-for-recurring");
    expect(result.amount).toBe(0);
  });

  it("handles a zero allowance without dividing by zero", () => {
    const result = safeToSpendToday(plan({ spendingAllowance: 0 }), 0, [], NOW);
    expect(result.status).toBe("over-budget");
    expect(result.amount).toBe(0);
  });
});

describe("warning thresholds", () => {
  it("uses configured thresholds at 80 and 90 percent", () => {
    expect(budgetAlertLevel(75, [80, 90, 100])).toEqual({ level: "none", threshold: null });
    expect(budgetAlertLevel(80, [80, 90, 100])).toEqual({ level: "warning", threshold: 80 });
    expect(budgetAlertLevel(92, [80, 90, 100])).toEqual({ level: "warning", threshold: 90 });
  });

  it("reports the limit and over-limit states separately", () => {
    expect(budgetAlertLevel(100, [80, 90, 100])).toEqual({ level: "limit", threshold: 100 });
    expect(budgetAlertLevel(112, [80, 90, 100])).toEqual({ level: "over", threshold: 100 });
  });

  it("supports custom thresholds", () => {
    expect(budgetAlertLevel(55, [50])).toEqual({ level: "warning", threshold: 50 });
    expect(budgetAlertLevel(40, [50])).toEqual({ level: "none", threshold: null });
  });
});
