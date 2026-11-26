import { afterEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "@/stores/settings-store";
import {
  analyzeInsights,
  makeComparison,
  needWantBreakdown,
  paymentBreakdown,
  paymentGroup,
  rangeForMode,
  yearlyMonths,
} from "./insights";
import type { Transaction } from "@/types";

const ANCHOR = new Date(2026, 10, 26); // Thursday, 26 November 2026

afterEach(() => {
  useSettingsStore.setState({ weekStartsOn: "monday" });
});
const rupees = (value: number) => Math.round(value * 100);

function entry(
  date: string,
  amount: number,
  categoryId: string,
  paymentMethod = "UPI",
  classification: "need" | "want" | undefined = undefined,
): Transaction {
  return {
    id: 1,
    type: "expense",
    amount: rupees(amount),
    categoryId,
    title: "Test expense",
    date,
    paymentMethod,
    classification,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe("comparisons", () => {
  it("does not invent a percentage when the previous period has no data", () => {
    expect(makeComparison(1000, 0)).toEqual({
      current: 1000,
      previous: 0,
      delta: 1000,
      percentChange: null,
      hasPrevious: false,
    });
  });

  it("computes a percentage when previous data exists", () => {
    expect(makeComparison(1220, 1000).percentChange).toBeCloseTo(22);
  });
});

describe("payment and classification grouping", () => {
  it("groups card types and unknown methods correctly", () => {
    expect(paymentGroup("Debit Card")).toBe("Card");
    expect(paymentGroup("Credit Card")).toBe("Card");
    expect(paymentGroup("Bank Transfer")).toBe("Bank transfer");
    expect(paymentGroup(undefined)).toBe("Other");
  });

  it("breaks down only expenses into payment groups", () => {
    const transactions = [
      entry("2026-11-02", 100, "food", "UPI"),
      entry("2026-11-03", 200, "shopping", "Credit Card"),
      { ...entry("2026-11-01", 500, "salary", "Bank Transfer"), type: "income" as const },
    ];
    const result = paymentBreakdown(transactions);
    expect(result.map((item) => item.group)).toEqual(["UPI", "Card"]);
    expect(result[0].percentage).toBeCloseTo(33.33);
    expect(result[1].percentage).toBeCloseTo(66.67);
  });

  it("ignores unclassified expenses in the need versus want split", () => {
    const result = needWantBreakdown([
      entry("2026-11-02", 100, "food", "UPI", "need"),
      entry("2026-11-03", 50, "shopping", "UPI", "want"),
      entry("2026-11-04", 25, "food", "UPI", undefined),
    ]);
    expect(result).toEqual({ need: rupees(100), want: rupees(50), needCount: 1, wantCount: 1 });
  });
});

describe("range resolution", () => {
  it("uses Monday-to-Sunday weeks with a matching previous week", () => {
    const weekly = rangeForMode("weekly", ANCHOR);
    expect(weekly.from).toBe("2026-11-23");
    expect(weekly.to).toBe("2026-11-29");
    expect(weekly.previousFrom).toBe("2026-11-16");
    expect(weekly.previousTo).toBe("2026-11-22");
  });

  it("respects a Sunday week start preference", () => {
    useSettingsStore.setState({ weekStartsOn: "sunday" });
    expect(rangeForMode("weekly", ANCHOR).from).toBe("2026-11-22");
  });

  it("uses the full calendar month and previous month", () => {
    const monthly = rangeForMode("monthly", ANCHOR);
    expect(monthly.from).toBe("2026-11-01");
    expect(monthly.to).toBe("2026-11-30");
    expect(monthly.previousFrom).toBe("2026-10-01");
    expect(monthly.previousTo).toBe("2026-10-31");
  });

  it("returns twelve ordered months for a year", () => {
    const months = yearlyMonths([], 2026);
    expect(months).toHaveLength(12);
    expect(months[0].key).toBe("2026-01");
    expect(months[11].key).toBe("2026-12");
    expect(months[0].label).toBe("Jan");
  });
});

describe("generated insights", () => {
  const categories = [{ id: "food", name: "Food" }];

  it("never generates comparisons when the previous period has no data", () => {
    const result = analyzeInsights([entry("2026-11-10", 1800, "food")], {
      mode: "monthly",
      anchor: ANCHOR,
      categories,
    });
    expect(result.insights.join(" ")).toContain("₹1,800 on Food");
    expect(result.insights.join(" ")).not.toContain("compared to");
    expect(result.insights.join(" ")).not.toContain("increased");
    expect(result.categories[0].comparison.percentChange).toBeNull();
  });

  it("reports real percentage changes from previous data", () => {
    const transactions = [
      entry("2026-11-10", 1220, "food"),
      entry("2026-10-10", 1000, "food"),
    ];
    const result = analyzeInsights(transactions, {
      mode: "monthly",
      anchor: ANCHOR,
      categories,
    });
    expect(result.insights.join(" ")).toContain("increased 22%");
  });

  it("produces no statements from an empty journal", () => {
    const result = analyzeInsights([], { mode: "monthly", anchor: ANCHOR, categories, goals: [] });
    expect(result.insights).toEqual([]);
  });

  it("identifies the highest spending day from a week", () => {
    const transactions = [
      entry("2026-11-23", 100, "food"),
      entry("2026-11-24", 500, "shopping", "UPI", "want"),
    ];
    const result = analyzeInsights(transactions, { mode: "weekly", anchor: ANCHOR, categories });
    expect(result.weekly.highestDay?.label).toBe("Tuesday");
    expect(result.weekly.highestDay?.amount).toBe(rupees(500));
    expect(result.weekly.dailyAverage).toBeCloseTo(rupees(600) / 7);
  });
});
