import Link from "next/link";
import { ArrowRight, PiggyBank } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, goalProgress } from "@/lib/calculations";
import { TINT_CLASSES } from "@/constants";
import type { Goal } from "@/types";
import { cn } from "@/lib/utils";

export function SavingsGoalMini({ goals }: { goals: Goal[] }) {
  const top = [...goals]
    .sort((a, b) => goalProgress(b.savedAmount, b.targetAmount) - goalProgress(a.savedAmount, a.targetAmount))
    .slice(0, 2);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Savings goal</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Closest to completion</p>
        </div>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          See all <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <div className="space-y-5 px-5 pb-5">
        {top.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-elevated/30 px-4 py-6 text-center">
            <PiggyBank className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-foreground">No savings goals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Give your savings a destination.</p>
          </div>
        ) : (
          top.map((goal) => {
            const percent = Math.round(goalProgress(goal.savedAmount, goal.targetAmount) * 100);
            const tint = TINT_CLASSES[goal.tint];
            return (
              <div key={goal.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      tint.background,
                      tint.border,
                      tint.text,
                    )}
                  >
                    <CategoryIcon name={goal.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-primary">
                    {percent}%
                  </span>
                </div>
                <Progress value={percent} />
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
