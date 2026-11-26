import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface BudgetProgressRowProps {
  label: string;
  spent: number;
  limit: number;
  className?: string;
}

export function BudgetProgressRow({
  label,
  spent,
  limit,
  className,
}: BudgetProgressRowProps) {
  const ratio = limit === 0 ? 0 : spent / limit;
  const overBudget = spent > limit;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-foreground">{label}</span>
        <span className={cn("tabular-nums", overBudget ? "text-danger" : "text-muted-foreground")}>
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
      </div>
      <Progress value={Math.min(ratio, 1) * 100} className={cn(overBudget && "[&>div]:bg-danger")} />
    </div>
  );
}
