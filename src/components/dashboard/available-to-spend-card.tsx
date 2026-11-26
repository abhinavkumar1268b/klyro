import { CircleCheck, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface AvailableToSpendCardProps {
  amount: number;
  budgetTotal: number;
  withinBudget: boolean;
  fallbackFromIncome: boolean;
  excess: number;
}

export function AvailableToSpendCard({
  amount,
  budgetTotal,
  withinBudget,
  fallbackFromIncome,
  excess,
}: AvailableToSpendCardProps) {
  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Available to spend
        </p>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]",
            withinBudget
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-danger/25 bg-danger/10 text-danger",
          )}
        >
          {withinBudget ? "On track" : "Over limit"}
        </span>
      </div>

      <p className="mt-5 text-[44px] font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-[56px]">
        {formatCurrency(amount)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {withinBudget ? (
          <CircleCheck className="size-4 text-primary" aria-hidden="true" />
        ) : (
          <Info className="size-4 text-danger" aria-hidden="true" />
        )}
        <p className={withinBudget ? "text-foreground" : "text-danger"}>
          {fallbackFromIncome
            ? withinBudget
              ? "You're tracking spending without a budget."
              : "Spending is ahead of income this month."
            : withinBudget
              ? "You're within your monthly budget."
              : `You're over your monthly budget by ${formatCurrency(excess)}.`}
        </p>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {fallbackFromIncome
          ? "Based on this month's income and spending — set up a budget for a firm allowance."
          : `Of ${formatCurrency(budgetTotal)} planned for this month.`}
      </p>
    </Card>
  );
}
