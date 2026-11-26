import { describe, expect, it } from "vitest";
import {
  advanceDueDate,
  daysUntilDue,
  daysWithinAllowance,
  goalMilestones,
  isReminderActive,
  monthsWithinBudget,
  trackingStreak,
} from "./progress";
import { upcomingRecurringTotal } from "./budget";
import type { BudgetPlan, Goal, RecurringPayment, Transaction } from "@/types";

const NOW = new Date(2026, 10, 26); // 26 November 2026
const rupees = (value: number) => Math.round(value * 100);

function expense(date: string, amount: number): Transaction {
  return {
    id: 1,
    type: "expense",
    amount: rupees(amount),
    categoryId: "food",
    title: "Expense",
    date,
    paymentMethod: "UPI",
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

function plan(overrides: Partial<BudgetPlan> = {}): BudgetPlan {
  return {
    month: "2026-11",
    enabled: true,
    totalAvailable: rupees(10000),
    spendingAllowance: rupees(3000),
    protectedSavings: rupees(7000),
    thresholds: [80, 90, 100],
    recurringExpenses: [],
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function goal(saved: number, target: number): Goal {
  return {
    id: 1,
    name: "Goal",
    targetAmount: rupees(target),
    savedAmount: rupees(saved),
    icon: "Target",
    tint: "lime",
    contributions: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completedAt: saved >= target ? "2026-02-01T00:00:00.000Z" : undefined,
  };
}

function recurring(overrides: Partial<RecurringPayment> = {}): RecurringPayment {
  return {
    id: 1,
    name: "Rent",
    amount: rupees(500),
    categoryId: "bills",
    frequency: "monthly",
    nextDueDate: "2026-11-28",
    reminderDays: 3,
    autoRecord: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("tracking consistency", () => {
  it("counts consecutive days ending today or yesterday", () => {
    expect(trackingStreak([expense("2026-11-24", 100), expense("2026-11-25", 100), expense("2026-11-26", 100)], NOW)).toBe(3);
    expect(trackingStreak([expense("2026-11-24", 100), expense("2026-11-25", 100)], NOW)).toBe(2);
    expect(trackingStreak([expense("2026-11-20", 100)], NOW)).toBe(0);
  });

  it("counts only recorded days inside the daily allowance share", () => {
    const result = daysWithinAllowance(
      plan({ spendingAllowance: rupees(3000) }),
      [expense("2026-11-25", 90), expense("2026-11-26", 200)],
      NOW,
    );
    expect(result.dailyAllowance).toBe(rupees(100));
    expect(result.count).toBe(1);
    expect(result.elapsedDays).toBe(26);
  });

  it("returns zero allowance days when budgeting is disabled", () => {
    expect(daysWithinAllowance(plan({ enabled: false }), [], NOW).count).toBe(0);
  });

  it("counts completed goals and months inside budget", () => {
    expect(goalMilestones([goal(500, 500), goal(100, 500)])).toMatchObject({
      total: 2,
      completed: 1,
    });
    const plans = {
      "2026-11": plan({ spendingAllowance: rupees(5000) }),
      "2026-10": plan({ month: "2026-10", spendingAllowance: rupees(100) }),
    };
    expect(monthsWithinBudget(plans, [expense("2026-11-10", 100), expense("2026-10-10", 500)], NOW)).toBe(1);
  });
});

describe("recurring payments", () => {
  it("advances weekly, monthly and yearly dates", () => {
    expect(advanceDueDate("2026-11-26", "weekly")).toBe("2026-12-03");
    expect(advanceDueDate("2026-11-26", "monthly")).toBe("2026-12-26");
    expect(advanceDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceDueDate("2026-11-26", "yearly")).toBe("2027-11-26");
  });

  it("reports days until due and active reminders", () => {
    const payment = recurring({ nextDueDate: "2026-11-28", reminderDays: 3 });
    expect(daysUntilDue(payment, NOW)).toBe(2);
    expect(isReminderActive(payment, NOW)).toBe(true);
    expect(isReminderActive(recurring({ nextDueDate: "2026-12-10" }), NOW)).toBe(false);
  });

  it("reserves configured recurring payments in safe-to-spend totals", () => {
    const payments = [recurring({ name: "Rent", amount: rupees(500), nextDueDate: "2026-11-28" })];
    expect(upcomingRecurringTotal(plan(), [], NOW, payments)).toBe(rupees(500));
    expect(upcomingRecurringTotal(plan(), [expense("2026-11-28", 500)], NOW, payments)).toBe(0);
  });
});
