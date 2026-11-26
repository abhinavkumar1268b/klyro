"use client";

import { useState } from "react";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Info,
  Pencil,
  Plus,
  ShieldCheck,
  Trash,
  Wallet,
} from "lucide-react";
import { removeBudget } from "@/features/budget";
import { recordRecurringPayment, removeRecurringPayment } from "@/features/recurring";
import { useCurrentDate } from "@/hooks";
import {
  useBudgetPlan,
  useBudgets,
  useCategories,
  useGoals,
  useRecurringPayments,
  useTransactions,
} from "@/hooks";
import {
  budgetAlertLevel,
  budgetExcess,
  budgetUsage,
  calculateBudgetProgress,
  expensesInMonth,
  formatCurrency,
  formatMonth,
  getMonthKey,
  incomeInMonth,
  paymentMethodBreakdown,
  planAllocationRemaining,
  remainingSpendingAllowance,
  safeToSpendToday,
  totalsByCategory,
} from "@/lib/calculations";
import type { BudgetFormValues } from "@/lib/validation";
import type { RecurringPayment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseLocalDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import { BudgetForm } from "./budget-form";
import { BudgetPlanForm } from "./budget-plan-form";
import { RecurringPaymentForm } from "./recurring-payment-form";
import { RecurringPaymentsSection } from "./recurring-payments-section";

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetView() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions();
  const { data: goals } = useGoals();
  const { data: recurringPayments } = useRecurringPayments();
  const currentDate = useCurrentDate();
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey());
  const [followingCurrentMonth, setFollowingCurrentMonth] = useState(true);
  const month =
    followingCurrentMonth && currentDate ? currentDate.dateKey.slice(0, 7) : selectedMonth;
  const { data: plan, isLoading: planLoading } = useBudgetPlan(month);
  const [planOpen, setPlanOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; values: BudgetFormValues } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<number | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<number | null>(null);
  const [markingReminder, setMarkingReminder] = useState<number | null>(null);

  const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(month));
  const spent = expensesInMonth(transactions, month);
  const income = incomeInMonth(transactions, month);
  const scopedBudgets = budgets.filter((budget) => budget.month === month);
  const progress = scopedBudgets.map((budget) => calculateBudgetProgress(budget, transactions));
  const categoryTotals = totalsByCategory(monthTransactions).slice(0, 5);
  const methods = paymentMethodBreakdown(monthTransactions);
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";

  const usage = plan?.enabled ? budgetUsage(spent, plan.spendingAllowance) : 0;
  const remaining = plan?.enabled
    ? remainingSpendingAllowance(plan.spendingAllowance, spent)
    : 0;
  const excess = plan?.enabled ? budgetExcess(spent, plan.spendingAllowance) : 0;
  const alert = plan?.enabled ? budgetAlertLevel(usage, plan.thresholds) : { level: "none", threshold: null };
  const safe = plan?.enabled
    ? safeToSpendToday(
        plan,
        spent,
        transactions,
        currentDate ? parseLocalDateKey(currentDate.dateKey) : new Date(),
        recurringPayments,
      )
    : null;

  async function confirmDelete() {
    if (deleting === null) return;
    await removeBudget(deleting);
    setDeleting(null);
  }

  async function confirmDeleteReminder() {
    if (deletingReminder === null) return;
    await removeRecurringPayment(deletingReminder);
    setDeletingReminder(null);
  }

  async function confirmMarkReminder() {
    if (markingReminder === null) return;
    await recordRecurringPayment(markingReminder);
    setMarkingReminder(null);
  }

  if (isLoading || planLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-52 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(shiftMonth(month, -1));
              setFollowingCurrentMonth(false);
            }}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <p className="min-w-40 text-center text-sm font-medium text-foreground">
            {formatMonth(month)}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(shiftMonth(month, 1));
              setFollowingCurrentMonth(false);
            }}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPlanOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {plan ? <Pencil className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {plan ? "Edit plan" : "Set up budget"}
        </button>
      </div>

      {!plan?.enabled ? (
        <>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-medium text-foreground">No-budget mode</h3>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Budgeting is off. KLYRO still tracks income, expenses, category breakdowns, payment
                methods and savings goals — it simply won&apos;t compare spending to an allowance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              Enable budgeting
            </button>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-primary">
                {formatCurrency(income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total spending</p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(spent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categories used</p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                {categoryTotals.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Savings goals</p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                {goals.length}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Category breakdown
              </p>
              {categoryTotals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
              ) : (
                categoryTotals.map((item) => (
                  <div key={item.categoryId} className="flex items-center gap-3 text-sm">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground">
                      <CategoryIcon name={iconFor(item.categoryId)} className="size-4" />
                    </span>
                    <span className="flex-1 truncate text-foreground">
                      {nameFor(item.categoryId)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Payment methods
              </p>
              {methods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No methods recorded yet.</p>
              ) : (
                methods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">{method.method}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {method.count} · {formatCurrency(method.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
        <RecurringPaymentsSection
          payments={recurringPayments}
          nameFor={nameFor}
          onAdd={() => {
            setEditingReminder(null);
            setReminderFormOpen(true);
          }}
          onEdit={(id) => {
            setEditingReminder(id);
            setReminderFormOpen(true);
          }}
          onMark={setMarkingReminder}
          onDelete={setDeletingReminder}
        />
        </>
      ) : plan ? (
        <>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Monthly allocation</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatMonth(month)}</p>
              </div>
              <Badge variant={plan.enabled ? "default" : "secondary"}>
                {plan.enabled ? "Budgeting on" : "Budgeting off"}
              </Badge>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Total available</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {formatCurrency(plan.totalAvailable)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spending allowance</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {formatCurrency(plan.spendingAllowance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protected savings</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">
                  {formatCurrency(plan.protectedSavings)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3" aria-hidden="true" /> Planned only — not transferred
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unallocated</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {formatCurrency(planAllocationRemaining(plan))}
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-border pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-foreground">{formatCurrency(spent)} spent</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  of {formatCurrency(plan.spendingAllowance)} allowance
                </p>
              </div>
              <div className="mt-3">
                <Progress
                  value={Math.min(usage, 100)}
                  className={cn("h-2", alert.level === "over" && "[&>div]:bg-danger")}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{Math.round(usage)}% of allowance used</span>
                {excess > 0 ? (
                  <span className="font-medium text-danger">
                    Exceeded by {formatCurrency(excess)}
                  </span>
                ) : (
                  <span className="font-medium text-primary">
                    {formatCurrency(remaining)} left to spend
                  </span>
                )}
              </div>
            </div>
          </Card>

          {alert.level !== "none" ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3.5",
                alert.level === "over"
                  ? "border-danger/25 bg-danger/5"
                  : "border-primary/20 bg-primary/5",
              )}
            >
              <BellRing
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  alert.level === "over" ? "text-danger" : "text-primary",
                )}
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-foreground">
                {alert.level === "over"
                  ? `You are ${formatCurrency(excess)} over your ${formatCurrency(plan.spendingAllowance)} allowance.`
                  : alert.level === "limit"
                    ? "You have reached 100% of your spending allowance."
                    : `${alert.threshold}% warning: ${Math.round(usage)}% of your allowance is used.`}
              </p>
            </div>
          ) : null}

          {safe ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Safe to spend today</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remaining allowance spread across {safe.daysLeft} days
                    {safe.upcomingRecurring > 0
                      ? `, after ${formatCurrency(safe.upcomingRecurring)} of pending recurring expenses`
                      : ""}
                    .
                  </p>
                </div>
                {safe.status === "available" ? (
                  <CircleCheck className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <Info className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <p
                className={cn(
                  "mt-4 text-3xl font-semibold tabular-nums",
                  safe.status === "available" ? "text-primary" : "text-foreground",
                )}
              >
                {safe.status === "available" ? formatCurrency(safe.amount) : "No allowance today"}
              </p>
              {safe.status !== "available" ? (
                <p className="mt-2 text-sm text-muted-foreground">{safe.explanation}</p>
              ) : null}
              {plan.recurringExpenses.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  {plan.recurringExpenses.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-md border border-border bg-elevated/40 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {item.label} · {formatCurrency(item.amount)} · day {item.dayOfMonth}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}

          <RecurringPaymentsSection
            payments={recurringPayments}
            nameFor={nameFor}
            onAdd={() => {
              setEditingReminder(null);
              setReminderFormOpen(true);
            }}
            onEdit={(id) => {
              setEditingReminder(id);
              setReminderFormOpen(true);
            }}
            onMark={setMarkingReminder}
            onDelete={setDeletingReminder}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Category limits</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional per-category caps for {formatMonth(month)}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-elevated/40 px-3 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add limit
            </button>
          </div>

          {progress.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No category limits yet"
              description="Add optional limits to see where individual categories stand."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {progress.map((item) => {
                const over = item.spent > item.budget.amount;
                const percent = Math.round(item.ratio * 100);
                return (
                  <Card key={item.budget.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground">
                          <CategoryIcon name={iconFor(item.budget.categoryId)} className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {nameFor(item.budget.categoryId)}
                          </p>
                          <p className="text-xs text-muted-foreground">Monthly limit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: item.budget.id!,
                              values: {
                                categoryId: item.budget.categoryId,
                                month: item.budget.month,
                                amount: item.budget.amount / 100,
                              },
                            })
                          }
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                          aria-label={`Edit ${nameFor(item.budget.categoryId)} limit`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(item.budget.id!)}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`Delete ${nameFor(item.budget.categoryId)} limit`}
                        >
                          <Trash className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex items-baseline justify-between gap-3">
                      <p className="text-xl font-semibold tabular-nums text-foreground">
                        {formatCurrency(item.spent)}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        of {formatCurrency(item.budget.amount)}
                      </p>
                    </div>
                    <div className="mt-3">
                      <Progress
                        value={Math.min(percent, 100)}
                        className={cn(over && "[&>div]:bg-danger")}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{percent}% used</span>
                      <span className={cn(over ? "text-danger" : "text-primary")}>
                        {over
                          ? `${formatCurrency(Math.abs(item.remaining))} over`
                          : `${formatCurrency(item.remaining)} left`}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plan ? "Edit budget plan" : "Set up your budget"}</DialogTitle>
            <DialogDescription>
              Allocate your money. Savings here are planned, never physically moved.
            </DialogDescription>
          </DialogHeader>
          <BudgetPlanForm
            month={month}
            plan={plan}
            onSaved={() => setPlanOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category limit" : "Set a category limit"}</DialogTitle>
            <DialogDescription>
              {editing ? "Adjust this category's monthly cap." : `A cap for ${formatMonth(month)}.`}
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            month={editing?.values.month ?? month}
            categories={categories}
            defaultValues={editing?.values}
            onSaved={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={reminderFormOpen || editingReminder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReminderFormOpen(false);
            setEditingReminder(null);
          }
        }}
      >
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReminder !== null ? "Edit reminder" : "New recurring payment"}</DialogTitle>
            <DialogDescription>
              Reminders stay local. Automatic recording is off unless you explicitly enable it.
            </DialogDescription>
          </DialogHeader>
          <RecurringPaymentForm
            categories={categories}
            payment={
              recurringPayments.find((item) => item.id === editingReminder) as
                | RecurringPayment
                | undefined
            }
            onSaved={() => {
              setReminderFormOpen(false);
              setEditingReminder(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this limit?"
        description="This category cap will be removed. Your transactions are not affected."
        confirmLabel="Delete limit"
        variant="danger"
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={deletingReminder !== null}
        onOpenChange={(open) => !open && setDeletingReminder(null)}
        title="Delete this reminder?"
        description="The reminder will be removed. Any transactions already recorded stay in your journal."
        confirmLabel="Delete reminder"
        variant="danger"
        onConfirm={confirmDeleteReminder}
      />

      <ConfirmDialog
        open={markingReminder !== null}
        onOpenChange={(open) => !open && setMarkingReminder(null)}
        title="Record this payment?"
        description="An expense will be added to your journal for the due date and the next due date will advance."
        confirmLabel="Mark as paid"
        onConfirm={confirmMarkReminder}
      />
    </div>
  );
}
