import type * as React from "react";
import { CircleCheck, Clock3 } from "lucide-react";
import { formatCurrency, formatDate, goalProgress } from "@/lib/calculations";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TINT_CLASSES } from "@/constants";
import type { Goal } from "@/types";
import { cn } from "@/lib/utils";

interface GoalProgressCardProps {
  goal: Goal;
  actions?: React.ReactNode;
}

export function GoalProgressCard({ goal, actions }: GoalProgressCardProps) {
  const tint = TINT_CLASSES[goal.tint];
  const percent = Math.round(goalProgress(goal.savedAmount, goal.targetAmount) * 100);
  const completed = goal.completedAt !== undefined || percent >= 100;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border",
              tint.background,
              tint.border,
              tint.text,
            )}
          >
            <CategoryIcon name={goal.icon} className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              {completed ? (
                <>
                  <CircleCheck className="size-3 text-primary" aria-hidden="true" /> Completed
                </>
              ) : goal.deadline ? (
                <>
                  <Clock3 className="size-3" aria-hidden="true" /> By {formatDate(goal.deadline)}
                </>
              ) : (
                "No target date"
              )}
            </p>
          </div>
        </div>
        <Badge variant={completed ? "default" : "secondary"}>{percent}%</Badge>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(goal.savedAmount)}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            of {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <Progress value={percent} />
      </div>

      {actions ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{actions}</div>
      ) : null}
    </Card>
  );
}
