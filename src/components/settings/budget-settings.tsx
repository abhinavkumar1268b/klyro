"use client";

import { useState } from "react";
import { Pencil, Plus, Trash } from "lucide-react";
import { savePlan } from "@/features/budget";
import { removeBudget } from "@/features/budget";
import { useBudgetPlan, useBudgets, useCategories, useCurrentDate } from "@/hooks";
import { formatCurrency, formatMonth, getMonthKey } from "@/lib/calculations";
import type { Budget } from "@/types";
import { notify } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsSection } from "./settings-section";
import { BudgetForm } from "@/components/budget/budget-form";
import { BudgetPlanForm } from "@/components/budget/budget-plan-form";

export function BudgetSettings() {
  const currentDate = useCurrentDate();
  const month = currentDate?.dateKey.slice(0, 7) ?? getMonthKey();
  const { data: plan } = useBudgetPlan(month);
  const { data: budgets } = useBudgets();
  const { data: categories } = useCategories();
  const [planOpen, setPlanOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const monthBudgets = budgets.filter((item) => item.month === month);
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;

  async function toggleMode() {
    if (!plan) {
      setPlanOpen(true);
      return;
    }
    try {
      await savePlan({ ...plan, enabled: !plan.enabled, updatedAt: new Date().toISOString() });
      notify({
        variant: "success",
        title: plan.enabled ? "Budgeting switched off" : "Budgeting switched on",
      });
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not update budget mode" });
    }
  }

  function openLimit(budget?: Budget) {
    setEditingLimit(budget ?? null);
    setLimitOpen(true);
  }

  async function confirmDelete() {
    if (deleting === null) return;
    await removeBudget(deleting);
    setDeleting(null);
  }

  return (
    <SettingsSection
      title="Budget"
      description={`Your ${formatMonth(month)} plan and category limits.`}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={plan?.enabled ? "default" : "secondary"}>
            {plan?.enabled ? "Budgeting on" : "No-budget mode"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setPlanOpen(true)}>
            {plan ? "Edit monthly plan" : "Set up budget"}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleMode}>
            {plan?.enabled ? "Switch budgeting off" : "Enable budgeting"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
            <p className="text-xs text-muted-foreground">Monthly budget</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
              {plan ? formatCurrency(plan.spendingAllowance) : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
            <p className="text-xs text-muted-foreground">Savings allocation</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-primary">
              {plan ? formatCurrency(plan.protectedSavings) : "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Planned, not transferred</p>
          </div>
          <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
            <p className="text-xs text-muted-foreground">Warning thresholds</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
              {plan?.thresholds.map((value) => `${value}%`).join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Category limits</p>
            <Button size="sm" variant="ghost" onClick={() => openLimit()}>
              <Plus className="size-4" aria-hidden="true" />
              Add limit
            </Button>
          </div>
          {monthBudgets.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No category limits configured.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {monthBudgets.map((budget) => (
                <div
                  key={budget.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated/40 px-3.5 py-2.5"
                >
                  <span className="truncate text-sm text-foreground">
                    {nameFor(budget.categoryId)}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(budget.amount)}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openLimit(budget)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
                      aria-label={`Edit ${nameFor(budget.categoryId)} limit`}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(budget.id!)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${nameFor(budget.categoryId)} limit`}
                    >
                      <Trash className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monthly budget plan</DialogTitle>
            <DialogDescription>Allocate your money; savings are planned, never moved.</DialogDescription>
          </DialogHeader>
          <BudgetPlanForm month={month} plan={plan} onSaved={() => setPlanOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLimit ? "Edit category limit" : "Set a category limit"}</DialogTitle>
            <DialogDescription>Saving a limit for an existing category updates it.</DialogDescription>
          </DialogHeader>
          <BudgetForm
            month={month}
            categories={categories}
            defaultValues={
              editingLimit
                ? {
                    categoryId: editingLimit.categoryId,
                    month: editingLimit.month,
                    amount: editingLimit.amount / 100,
                  }
                : undefined
            }
            onSaved={() => setLimitOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this category limit?"
        description="The limit will be removed. Transactions in that category are unaffected."
        confirmLabel="Delete limit"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </SettingsSection>
  );
}
