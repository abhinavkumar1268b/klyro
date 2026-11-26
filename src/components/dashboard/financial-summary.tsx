import { ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { StatCard } from "./stat-card";

interface FinancialSummaryProps {
  spent: number;
  protectedSavings: number;
  remainingBudget: number;
  transactionCount: number;
  goalCount: number;
  tracking: boolean;
}

export function FinancialSummary({
  spent,
  protectedSavings,
  remainingBudget,
  transactionCount,
  goalCount,
  tracking,
}: FinancialSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Total spent"
        value={formatCurrency(spent)}
        icon={ArrowUpRight}
        hint={`This month · ${transactionCount} ${transactionCount === 1 ? "entry" : "entries"}`}
      />
      <StatCard
        label="Protected savings"
        value={formatCurrency(protectedSavings)}
        icon={ShieldCheck}
        tone="positive"
        hint={
          tracking
            ? `No savings plan · ${goalCount} ${goalCount === 1 ? "goal" : "goals"} tracked`
            : "Planned allocation — no money is moved"
        }
      />
      <StatCard
        label={tracking ? "Income kept" : "Remaining budget"}
        value={formatCurrency(remainingBudget)}
        icon={Wallet}
        tone={remainingBudget >= 0 ? "positive" : "negative"}
        hint={tracking ? "Income minus expenses" : "Still available this month"}
      />
    </div>
  );
}
