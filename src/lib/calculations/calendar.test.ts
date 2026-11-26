import { describe, expect, it } from "vitest";
import { buildMonthlyCalendar, shiftMonthKey } from "./calendar";
import type { Transaction } from "@/types";

const rupees = (value: number) => Math.round(value * 100);

function entry(
  date: string,
  amount: number,
  type: Transaction["type"] = "expense",
): Transaction {
  return {
    id: 1,
    type,
    amount: rupees(amount),
    categoryId: "food",
    title: "Test entry",
    date,
    paymentMethod: "UPI",
    classification: type === "expense" ? "need" : undefined,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe("month grid", () => {
  it("handles 28, 29, 30 and 31 day months", () => {
    expect(buildMonthlyCalendar([], "2026-02").days.filter((d) => d.inMonth)).toHaveLength(28);
    expect(buildMonthlyCalendar([], "2028-02").days.filter((d) => d.inMonth)).toHaveLength(29);
    expect(buildMonthlyCalendar([], "2026-04").days.filter((d) => d.inMonth)).toHaveLength(30);
    expect(buildMonthlyCalendar([], "2026-12").days.filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("starts the grid on the correct weekday for several months", () => {
    const cases: Array<[string, number]> = [
      ["2026-11-01", 0], // Sunday
      ["2026-06-01", 1], // Monday
      ["2026-09-01", 2], // Tuesday
      ["2026-04-01", 3], // Wednesday
      ["2026-01-01", 4], // Thursday
      ["2026-05-01", 5], // Friday
      ["2026-08-01", 6], // Saturday
    ];
    for (const [date, index] of cases) {
      const month = date.slice(0, 7);
      const calendar = buildMonthlyCalendar([], month);
      expect(calendar.days[index].day).toBe(1);
      expect(calendar.days[index].inMonth).toBe(true);
    }
  });

  it("navigates across year boundaries", () => {
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
    expect(shiftMonthKey("2027-01", -1)).toBe("2026-12");
    expect(shiftMonthKey("2028-02", -12)).toBe("2027-02");
  });

  it("uses whole weeks and no horizontal date gaps", () => {
    const calendar = buildMonthlyCalendar([], "2026-11");
    expect(calendar.days.length % 7).toBe(0);
    expect(calendar.weeks.length * 7).toBe(calendar.days.length);
  });
});

describe("daily totals", () => {
  it("keeps zero spending muted when a month has no transactions", () => {
    const calendar = buildMonthlyCalendar([], "2026-11");
    expect(calendar.totalExpenses).toBe(0);
    expect(calendar.totalIncome).toBe(0);
    expect(calendar.activeDays).toBe(0);
    expect(calendar.days.every((day) => day.level === "zero")).toBe(true);
  });

  it("sums multiple expenses on the same date", () => {
    const calendar = buildMonthlyCalendar(
      [entry("2026-11-05", 120), entry("2026-11-05", 80), entry("2026-11-06", 250)],
      "2026-11",
    );
    const fifth = calendar.days.find((day) => day.date === "2026-11-05")!;
    expect(fifth.expenses).toBe(rupees(200));
    expect(fifth.count).toBe(2);
    expect(calendar.totalExpenses).toBe(rupees(450));
    expect(calendar.activeDays).toBe(2);
  });

  it("counts income and expenses separately on the same date", () => {
    const calendar = buildMonthlyCalendar(
      [entry("2026-11-10", 300, "income"), entry("2026-11-10", 120)],
      "2026-11",
    );
    const day = calendar.days.find((item) => item.date === "2026-11-10")!;
    expect(day.expenses).toBe(rupees(120));
    expect(day.income).toBe(rupees(300));
    expect(day.count).toBe(2);
    expect(calendar.peakExpense).toBe(rupees(120));
  });

  it("ignores transactions outside the selected month", () => {
    const calendar = buildMonthlyCalendar(
      [entry("2026-10-31", 500), entry("2026-12-01", 500), entry("2026-11-15", 90)],
      "2026-11",
    );
    expect(calendar.totalExpenses).toBe(rupees(90));
  });
});

describe("spending intensity", () => {
  it("derives levels from the selected month's distribution", () => {
    const calendar = buildMonthlyCalendar(
      [
        entry("2026-11-02", 100),
        entry("2026-11-03", 200),
        entry("2026-11-04", 300),
        entry("2026-11-05", 1000),
      ],
      "2026-11",
    );
    const levelFor = (date: string) =>
      calendar.days.find((day) => day.date === date)!.level;
    expect(levelFor("2026-11-02")).toBe("low");
    expect(levelFor("2026-11-03")).toBe("low");
    expect(levelFor("2026-11-04")).toBe("medium");
    expect(levelFor("2026-11-05")).toBe("high");
    expect(levelFor("2026-11-06")).toBe("zero");
  });

  it("marks today without shifting the stored date", () => {
    const calendar = buildMonthlyCalendar(
      [entry("2026-11-26", 150)],
      "2026-11",
      new Date(2026, 10, 26, 23, 30),
    );
    const day = calendar.days.find((item) => item.date === "2026-11-26")!;
    expect(day.date).toBe("2026-11-26");
    expect(day.isToday).toBe(true);
  });
});
