import { describe, expect, it } from "vitest";
import { transactionSchema } from "./transaction";
import { budgetPlanSchema } from "./budget-plan";
import { recurringPaymentSchema } from "./recurring-payment";

const baseTransaction = {
  type: "expense" as const,
  amount: 100,
  categoryId: "food",
  title: "Lunch",
  date: "2026-11-25",
  paymentMethod: "UPI" as const,
  classification: "need" as const,
};

describe("transaction validation edge cases", () => {
  it("rejects negative, zero and non-finite amounts", () => {
    expect(transactionSchema.safeParse({ ...baseTransaction, amount: -1 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...baseTransaction, amount: 0 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...baseTransaction, amount: Number.NaN }).success).toBe(false);
  });

  it("rejects an empty title and a missing expense classification", () => {
    expect(transactionSchema.safeParse({ ...baseTransaction, title: "   " }).success).toBe(false);
    const withoutClassification = { ...baseTransaction };
    delete (withoutClassification as Partial<typeof baseTransaction>).classification;
    expect(transactionSchema.safeParse(withoutClassification).success).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(transactionSchema.safeParse({ ...baseTransaction, date: "2026-02-30" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...baseTransaction, date: "2026-11-31" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...baseTransaction, date: "2026-11-25" }).success).toBe(true);
  });

  it("allows optional classification for income", () => {
    const income = { ...baseTransaction, type: "income" as const, classification: undefined };
    expect(transactionSchema.safeParse(income).success).toBe(true);
  });
});

describe("budget plan validation", () => {
  const basePlan = {
    enabled: true,
    totalAvailable: 10000,
    spendingAllowance: 7000,
    protectedSavings: 3000,
    thresholds: [80, 90, 100],
    recurringExpenses: [],
  };

  it("accepts allocations that exactly fit the total", () => {
    expect(budgetPlanSchema.safeParse(basePlan).success).toBe(true);
  });

  it("rejects allocations that exceed the total", () => {
    expect(
      budgetPlanSchema.safeParse({ ...basePlan, spendingAllowance: 7001 }).success,
    ).toBe(false);
  });

  it("rejects thresholds outside 1-100", () => {
    expect(budgetPlanSchema.safeParse({ ...basePlan, thresholds: [101] }).success).toBe(false);
    expect(budgetPlanSchema.safeParse({ ...basePlan, thresholds: [0] }).success).toBe(false);
  });
});

describe("recurring payment validation", () => {
  const base = {
    name: "Rent",
    amount: 1000,
    categoryId: "bills",
    frequency: "monthly" as const,
    nextDueDate: "2026-11-30",
    reminderDays: 3,
    autoRecord: false,
  };

  it("accepts a valid reminder", () => {
    expect(recurringPaymentSchema.safeParse(base).success).toBe(true);
  });

  it("rejects negative amounts, invalid dates and excessive reminder windows", () => {
    expect(recurringPaymentSchema.safeParse({ ...base, amount: -5 }).success).toBe(false);
    expect(recurringPaymentSchema.safeParse({ ...base, nextDueDate: "2026-13-01" }).success).toBe(false);
    expect(recurringPaymentSchema.safeParse({ ...base, reminderDays: 31 }).success).toBe(false);
  });
});
