import { describe, expect, it } from "vitest";
import {
  dailyMoneyActivity,
  hasSufficientBalance,
  summarizeWallet,
  totalMoney,
} from "./wallet";
import type {
  Transaction,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
} from "@/types";

const rupees = (value: number) => Math.round(value * 100);

function wallet(id: string, opening: number, overrides: Partial<Wallet> = {}): Wallet {
  return {
    id,
    name: id === "upi" ? "UPI" : "Cash",
    icon: id === "upi" ? "Smartphone" : "Banknote",
    enabled: true,
    openingBalance: rupees(opening),
    startDate: "2026-11-26",
    createdAt: "2026-11-26T00:00:00.000Z",
    updatedAt: "2026-11-26T00:00:00.000Z",
    ...overrides,
  };
}

function tx(
  date: string,
  type: Transaction["type"],
  amount: number,
  paymentMethod: string,
  walletId?: string,
): Transaction {
  return {
    id: 1,
    type,
    amount: rupees(amount),
    categoryId: "food",
    title: type === "income" ? "Freelancing" : "Food",
    date,
    paymentMethod,
    walletId,
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe("wallet balances", () => {
  const upi = wallet("upi", 3000);
  const cash = wallet("cash", 2000);

  it("starts from opening balances and computes total money", () => {
    const summaries = [upi, cash].map((item) => summarizeWallet(item, [], [], []));
    expect(summaries[0].balance).toBe(rupees(3000));
    expect(summaries[1].balance).toBe(rupees(2000));
    expect(totalMoney(summaries)).toBe(rupees(5000));
  });

  it("credits income to the selected wallet and debits expenses from the selected wallet", () => {
    const transactions = [
      tx("2026-11-26", "income", 100, "UPI"),
      tx("2026-11-26", "expense", 70, "Cash"),
    ];
    const summaries = [upi, cash].map((item) => summarizeWallet(item, transactions, [], []));
    expect(summaries[0].balance).toBe(rupees(3100));
    expect(summaries[1].balance).toBe(rupees(1930));
    expect(totalMoney(summaries)).toBe(rupees(5030));
  });

  it("never counts a transfer as income or expense and keeps total unchanged", () => {
    const transfers: WalletTransfer[] = [
      {
        id: 1,
        fromWalletId: "upi",
        toWalletId: "cash",
        amount: rupees(500),
        date: "2026-11-26",
        createdAt: "2026-11-26T12:00:00.000Z",
      },
    ];
    const summaries = [upi, cash].map((item) => summarizeWallet(item, [], transfers, []));
    expect(summaries[0].balance).toBe(rupees(2500));
    expect(summaries[1].balance).toBe(rupees(2500));
    expect(totalMoney(summaries)).toBe(rupees(5000));
  });

  it("applies signed manual adjustments", () => {
    const adjustments: WalletAdjustment[] = [
      { id: 1, walletId: "cash", amount: -rupees(200), date: "2026-11-26", createdAt: "2026-11-26T12:00:00.000Z" },
      { id: 2, walletId: "upi", amount: rupees(50), date: "2026-11-26", createdAt: "2026-11-26T12:00:00.000Z" },
    ];
    const summaries = [upi, cash].map((item) => summarizeWallet(item, [], [], adjustments));
    expect(summaries[0].balance).toBe(rupees(3050));
    expect(summaries[1].balance).toBe(rupees(1800));
  });

  it("ignores transactions before the wallet start date (safe migration)", () => {
    const transactions = [tx("2026-11-25", "income", 5000, "UPI")];
    const summary = summarizeWallet(upi, transactions, [], []);
    expect(summary.balance).toBe(rupees(3000));
    expect(summary.transactionCount).toBe(0);
  });

  it("excludes disabled wallets from total money", () => {
    const summaries = [upi, wallet("cash", 2000, { enabled: false })].map((item) =>
      summarizeWallet(item, [], [], []),
    );
    expect(totalMoney(summaries)).toBe(rupees(3000));
  });

  it("detects insufficient balances without touching other wallets", () => {
    expect(hasSufficientBalance(rupees(100), rupees(50))).toBe(false);
    expect(hasSufficientBalance(rupees(50), rupees(50))).toBe(true);
  });
});

describe("daily money activity", () => {
  it("keeps income and expense separate and supports same-day entries", () => {
    const transactions = [
      tx("2026-11-26", "income", 100, "UPI"),
      tx("2026-11-26", "expense", 70, "Cash"),
      tx("2026-11-26", "expense", 30, "UPI"),
      tx("2026-11-25", "income", 500, "UPI"),
    ];
    const activity = dailyMoneyActivity(transactions, "2026-11-26");
    expect(activity.income).toBe(rupees(100));
    expect(activity.expense).toBe(rupees(100));
    expect(activity.transactions).toHaveLength(3);
  });
});
