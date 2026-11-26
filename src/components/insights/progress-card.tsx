"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  daysWithinAllowance,
  formatCurrency,
  goalMilestones,
  monthsWithinBudget,
  trackingStreak,
} from "@/lib/calculations";
import type { BudgetPlan, Goal, Transaction } from "@/types";

interface ProgressCardProps {
  transactions: Transaction[];
  plan: BudgetPlan | null;
  plans: Record<string, BudgetPlan>;
  goals: Goal[];
}

export function ProgressCard({ transactions, plan, plans, goals }: ProgressCardProps) {
  const progress = useMemo(
    () => ({
      streak: trackingStreak(transactions),
      allowance: plan ? daysWithinAllowance(plan, transactions) : null,
      goals: goalMilestones(goals),
      months: monthsWithinBudget(plans, transactions),
    }),
    [transactions, plan, plans, goals],
  );

  const rows = [
    {
      label: "Expense tracking streak",
      value: progress.streak,
      target: 7,
      detail:
        progress.streak >= 3
          ? `${progress.streak} consecutive days recorded.`
          : "Record an expense each day to build a streak.",
    },
    {
      label: "Days within allowance",
      value: progress.allowance?.count ?? 0,
      target: Math.max(1, progress.allowance?.elapsedDays ?? 1),
      detail:
        progress.allowance && progress.allowance.dailyAllowance > 0
          ? `${progress.allowance.count} of ${progress.allowance.elapsedDays} days stayed within ${formatCurrency(
              progress.allowance.dailyAllowance,
            )} per day.`
          : "Set a spending allowance to track this.",
      disabled: !progress.allowance || progress.allowance.dailyAllowance <= 0,
    },
    {
      label: "Goal milestones",
      value: progress.goals.completed,
      target: Math.max(1, progress.goals.total),
      detail:
        progress.goals.total > 0
          ? `${progress.goals.completed} of ${progress.goals.total} goals completed.`
          : "Create a goal to see milestones here.",
      disabled: progress.goals.total === 0,
    },
    {
      label: "Months within budget",
      value: progress.months,
      target: 6,
      detail:
        progress.months > 0
          ? `${progress.months} month${progress.months === 1 ? "" : "s"} stayed within their allowance.`
          : "Months with a plan and spending inside it appear here.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consistency</CardTitle>
        <p className="text-xs text-muted-foreground">
          Quiet progress signals from your own records.
        </p>
      </CardHeader>

      <div className="space-y-5 px-5 pb-5">
        {rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-foreground">{row.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {row.value} / {row.target}
              </span>
            </div>
            <Progress value={row.disabled ? 0 : Math.min((row.value / row.target) * 100, 100)} />
            <p className="text-xs text-muted-foreground">{row.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
