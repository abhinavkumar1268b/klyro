import { fromMinorUnits } from "@/lib/calculations";
import { PAYMENT_METHODS } from "@/constants/transactions";
import type { Transaction } from "@/types";

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const header = [
    "Date",
    "Title",
    "Type",
    "Category",
    "Amount",
    "Payment Method",
    "Need/Want",
    "Description",
  ];
  const rows = transactions.map((transaction) =>
    [
      transaction.date,
      transaction.title,
      transaction.type,
      transaction.categoryId,
      fromMinorUnits(transaction.amount).toFixed(2),
      transaction.paymentMethod ?? PAYMENT_METHODS[1],
      transaction.classification ?? "",
      transaction.description ?? "",
    ]
      .map(escapeCell)
      .join(","),
  );

  return [header.join(","), ...rows].join("\r\n");
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
