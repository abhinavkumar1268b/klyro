import { ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { StatCard } from "./stat-card";

interface FinancialSummaryProps {
  spent: number;
  protectedSavings: number;
  remainingBudget: number;
  transactionCount: number;
  goalCount: number;
  tracking: boolean;
  onLoadSamples?: () => void;
  showSamplesAction?: boolean;
}

export function FinancialSummary({
  spent,
  protectedSavings,
  remainingBudget,
  transactionCount,
  goalCount,
  tracking,
  onLoadSamples,
  showSamplesAction,
}: FinancialSummaryProps) {
  return (
    <div className="space-y-3">
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
          label="Budget remaining"
          value={tracking ? "—" : formatCurrency(remainingBudget)}
          icon={Wallet}
          tone={tracking ? "default" : remainingBudget >= 0 ? "positive" : "negative"}
          hint={tracking ? "No budget active" : "Spending limit left — not wallet money"}
        />
      </div>
      {showSamplesAction && onLoadSamples ? (
        <Button size="sm" variant="outline" onClick={onLoadSamples}>
          Explore with sample data
        </Button>
      ) : null}
    </div>
  );
}
