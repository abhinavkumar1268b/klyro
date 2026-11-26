import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface BudgetProgressCardProps {
  monthLabel: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
}

export function BudgetProgressCard({
  monthLabel,
  limit,
  spent,
  remaining,
  percent,
}: BudgetProgressCardProps) {
  const over = remaining < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget progress</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{monthLabel}</p>
        </div>
        <Link
          href="/budget"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          Manage <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <div className="px-5 pb-5">
        {limit === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-elevated/30 px-4 py-6 text-center">
            <Wallet className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-foreground">No monthly limit set</p>
            <p className="mt-1 text-xs text-muted-foreground">Add one to track your progress.</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrency(spent)}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                of {formatCurrency(limit)}
              </p>
            </div>

            <div className="mt-4">
              <Progress
                value={Math.min(percent, 100)}
                className={cn("h-2", over && "[&>div]:bg-danger")}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Monthly limit</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(limit)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Remaining</p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium tabular-nums",
                    over ? "text-danger" : "text-primary",
                  )}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{Math.round(percent)}%</span> of your
              monthly budget consumed.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
