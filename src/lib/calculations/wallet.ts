import { walletIdForPaymentMethod } from "@/constants/wallets";
import type {
  Transaction,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
} from "@/types";

export interface WalletSummary {
  wallet: Wallet;
  balance: number;
  received: number;
  spent: number;
  transferredIn: number;
  transferredOut: number;
  adjustments: number;
  transactionCount: number;
}

function belongsToWallet(transaction: Transaction, wallet: Wallet): boolean {
  const id = transaction.walletId ?? walletIdForPaymentMethod(transaction.paymentMethod);
  return id === wallet.id && transaction.date >= wallet.startDate;
}

export function summarizeWallet(
  wallet: Wallet,
  transactions: Transaction[],
  transfers: WalletTransfer[],
  adjustments: WalletAdjustment[],
): WalletSummary {
  let received = 0;
  let spent = 0;
  let count = 0;

  for (const transaction of transactions) {
    if (!belongsToWallet(transaction, wallet)) continue;
    count += 1;
    if (transaction.type === "income") received += transaction.amount;
    else spent += transaction.amount;
  }

  const transferredIn = transfers
    .filter((transfer) => transfer.toWalletId === wallet.id && transfer.date >= wallet.startDate)
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const transferredOut = transfers
    .filter((transfer) => transfer.fromWalletId === wallet.id && transfer.date >= wallet.startDate)
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const adjustmentTotal = adjustments
    .filter((item) => item.walletId === wallet.id && item.date >= wallet.startDate)
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    wallet,
    received,
    spent,
    transferredIn,
    transferredOut,
    adjustments: adjustmentTotal,
    transactionCount: count,
    balance:
      wallet.openingBalance +
      received -
      spent +
      transferredIn -
      transferredOut +
      adjustmentTotal,
  };
}

export function totalMoney(summaries: WalletSummary[]): number {
  return summaries
    .filter((summary) => summary.wallet.enabled)
    .reduce((sum, summary) => sum + summary.balance, 0);
}

export interface DailyMoneyActivity {
  income: number;
  expense: number;
  transactions: Transaction[];
}

export function dailyMoneyActivity(transactions: Transaction[], dateKey: string): DailyMoneyActivity {
  const items = transactions.filter((transaction) => transaction.date === dateKey);
  return {
    income: items
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0),
    expense: items
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0),
    transactions: items,
  };
}

export function hasSufficientBalance(amount: number, balance: number): boolean {
  return amount <= balance;
}
