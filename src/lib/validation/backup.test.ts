import { describe, expect, it } from "vitest";
import { backupSchema, parseBackup } from "./backup";

const validPayload = {
  app: "KLYRO",
  exportedAt: "2026-11-26T10:00:00.000Z",
  categories: [
    { id: "food", name: "Food", type: "expense", icon: "UtensilsCrossed", tint: "amber", isDefault: true },
  ],
  transactions: [
    {
      id: 1,
      type: "expense",
      amount: 125000,
      categoryId: "food",
      title: "Lunch",
      date: "2026-11-25",
      paymentMethod: "UPI",
      classification: "need",
      createdAt: "2026-11-25T10:00:00.000Z",
      updatedAt: "2026-11-25T10:00:00.000Z",
    },
  ],
  budgets: [],
  goals: [],
  recurringPayments: [],
  settings: [{ key: "currency", value: "INR" }],
};

describe("backup validation", () => {
  it("accepts a well-formed KLYRO backup", () => {
    expect(backupSchema.safeParse(validPayload).success).toBe(true);
  });

  it("parses JSON text into a typed payload", () => {
    expect(parseBackup(JSON.stringify(validPayload)).transactions).toHaveLength(1);
  });

  it("rejects a foreign file before any restore can happen", () => {
    expect(() => parseBackup('{"hello":"world"}')).toThrow();
  });

  it("rejects malformed dates and non-integer amounts", () => {
    const badDate = { ...validPayload, transactions: [{ ...validPayload.transactions[0], date: "25-11-2026" }] };
    const badAmount = { ...validPayload, transactions: [{ ...validPayload.transactions[0], amount: 12.5 }] };
    expect(backupSchema.safeParse(badDate).success).toBe(false);
    expect(backupSchema.safeParse(badAmount).success).toBe(false);
  });

  it("rejects a file claiming to be another app", () => {
    expect(backupSchema.safeParse({ ...validPayload, app: "OTHER" }).success).toBe(false);
  });
});
