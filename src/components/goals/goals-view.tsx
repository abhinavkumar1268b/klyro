"use client";

import { useState } from "react";
import { CirclePlus, History, Pencil, PiggyBank, Plus, Trash } from "lucide-react";
import { removeGoal } from "@/features/goals";
import { useGoals } from "@/hooks";
import { formatCurrency, goalProgress } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContributeDialog } from "./contribute-dialog";
import { ContributionHistoryDialog } from "./contribution-history-dialog";
import { GoalForm } from "./goal-form";
import { GoalProgressCard } from "./goal-progress-card";

export function GoalsView() {
  const { data: goals, isLoading } = useGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [contributing, setContributing] = useState<number | null>(null);
  const [history, setHistory] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const completed = goals.filter((goal) => goalProgress(goal.savedAmount, goal.targetAmount) >= 1).length;

  async function confirmDelete() {
    if (deleting === null) return;
    await removeGoal(deleting);
    setDeleting(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {goals.length} {goals.length === 1 ? "goal" : "goals"} · {completed} completed
        </p>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New goal
        </button>
      </div>

      {goals.length > 0 ? (
        <Card className="grid gap-6 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs text-muted-foreground">Total saved</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">
              {formatCurrency(totalSaved)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Combined target</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(totalTarget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {totalTarget === 0 ? 0 : Math.round((totalSaved / totalTarget) * 100)}%
            </p>
          </div>
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No goals yet"
          description="Give your savings a purpose — a rainy-day fund, a new laptop, a trip. Start with one."
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <CirclePlus className="size-4" aria-hidden="true" />
              Create a goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalProgressCard
              key={goal.id}
              goal={goal}
              actions={
                <>
                  <Button size="sm" className="flex-1" onClick={() => setContributing(goal.id!)}>
                    Add money
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistory(goal.id!)}
                    aria-label={`Contribution history for ${goal.name}`}
                  >
                    <History className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(goal.id!)}
                    aria-label={`Edit ${goal.name}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleting(goal.id!)}
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash className="size-4" aria-hidden="true" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New savings goal</DialogTitle>
            <DialogDescription>Name it, set a target, and start small.</DialogDescription>
          </DialogHeader>
          <GoalForm onSaved={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
            <DialogDescription>Adjust the target, saved amount or target date.</DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <GoalForm
              goal={goals.find((goal) => goal.id === editing) ?? undefined}
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ContributeDialog
        goal={goals.find((goal) => goal.id === contributing) ?? null}
        open={contributing !== null}
        onOpenChange={(open) => !open && setContributing(null)}
      />

      <ContributionHistoryDialog
        goal={goals.find((goal) => goal.id === history) ?? null}
        open={history !== null}
        onOpenChange={(open) => !open && setHistory(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this goal?"
        description="Your saved amount record for this goal will be removed. This cannot be undone."
        confirmLabel="Delete goal"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
