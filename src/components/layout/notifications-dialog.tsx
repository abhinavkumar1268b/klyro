"use client";

import { useMemo } from "react";
import { useCurrentDate } from "@/hooks";
import { Bell, CircleCheck, Info } from "lucide-react";
import {
  useBudgetPlan,
  useBudgets,
  useGoals,
  useRecurringPayments,
  useTransactions,
} from "@/hooks";
import {
  budgetAlertLevel,
  budgetUsage,
  expensesInMonth,
  formatCurrency,
  getMonthKey,
  goalProgress,
  spentForBudget,
  isReminderActive,
  daysUntilDue,
  summarizeCashflow,
  todayISO,
} from "@/lib/calculations";
import { parseLocalDateKey } from "@/lib/date";
import { useSettingsStore } from "@/stores";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Alert {
  id: string;
  title: string;
  detail: string;
  tone: "warning" | "positive" | "neutral";
}

export function NotificationsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: budgets } = useBudgets();
  const { data: goals } = useGoals();
  const { data: transactions } = useTransactions();
  const { data: plan } = useBudgetPlan(getMonthKey());
  const { data: recurringPayments } = useRecurringPayments();
  const currentDate = useCurrentDate();
  const todayKey = currentDate?.dateKey ?? todayISO();
  const settings = useSettingsStore();
  const currency = settings.currency;
  const prefs = settings.notifications;

  const alerts = useMemo<Alert[]>(() => {
    const items: Alert[] = [];

    if (prefs.dailyReminders && !transactions.some((item) => item.date === todayKey)) {
      items.push({
        id: "daily-reminder",
        title: "No expense logged today",
        detail: "A quick entry keeps your daily and weekly numbers accurate.",
        tone: "neutral",
      });
    }

    if (prefs.budgetAlerts && plan?.enabled) {
      const spent = expensesInMonth(transactions, plan.month);
      const usage = budgetUsage(spent, plan.spendingAllowance);
      const alert = budgetAlertLevel(usage, plan.thresholds);
      if (alert.level !== "none") {
        items.push({
          id: "plan-alert",
          title:
            alert.level === "over"
              ? "Spending allowance exceeded"
              : alert.level === "limit"
                ? "Spending allowance reached"
                : `${alert.threshold}% warning`,
          detail: `${formatCurrency(spent, currency)} of ${formatCurrency(
            plan.spendingAllowance,
            currency,
          )} used (${Math.round(usage)}%).`,
          tone: alert.level === "over" ? "warning" : "neutral",
        });
      }
    }

    if (prefs.budgetAlerts) {
    for (const budget of budgets) {
      const spent = spentForBudget(budget, transactions);
      const usage = budgetUsage(spent, budget.amount);
      const alert = budgetAlertLevel(usage, plan?.thresholds ?? [80, 90, 100]);
      if (alert.level !== "none") {
        items.push({
          id: `budget-${budget.id ?? budget.categoryId}`,
          title:
            alert.level === "over"
              ? "Category limit exceeded"
              : alert.level === "limit"
                ? "Category limit reached"
                : `${alert.threshold}% category warning`,
          detail: `${formatCurrency(spent, currency)} of ${formatCurrency(
            budget.amount,
            currency,
          )} spent this month.`,
          tone: alert.level === "over" ? "warning" : "neutral",
        });
      }
    }
    }

    if (prefs.recurringReminders) {
    for (const payment of recurringPayments) {
      if (!isReminderActive(payment)) continue;
      const days = daysUntilDue(payment);
      items.push({
        id: `recurring-${payment.id}`,
        title: `${payment.name} due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}`,
        detail: `${formatCurrency(payment.amount, currency)} · ${payment.frequency} payment.`,
        tone: days <= 1 ? "warning" : "neutral",
      });
    }
    }

    if (prefs.weeklySummaries) {
      const cutoff = parseLocalDateKey(todayKey);
      cutoff.setDate(cutoff.getDate() - 6);
      const from = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
      const week = summarizeCashflow(transactions.filter((item) => item.date >= from));
      items.push({
        id: "weekly-summary",
        title: "Weekly summary",
        detail: `${formatCurrency(week.expense, currency)} spent over the last 7 days across ${week.count} entries.`,
        tone: "neutral",
      });
    }

    if (prefs.monthlySummaries) {
      const month = summarizeCashflow(
        transactions.filter((item) => item.date.startsWith(getMonthKey())),
      );
      items.push({
        id: "monthly-summary",
        title: "Monthly summary",
        detail: `${formatCurrency(month.expense, currency)} spent this month. Net cash flow ${formatCurrency(month.net, currency)}.`,
        tone: "neutral",
      });
    }

    for (const goal of goals) {
      const progress = goalProgress(goal.savedAmount, goal.targetAmount);
      if (progress >= 1) {
        items.push({
          id: `goal-${goal.id}`,
          title: `${goal.name} completed`,
          detail: "You reached this goal. Nicely done.",
          tone: "positive",
        });
      } else if (progress >= 0.75) {
        items.push({
          id: `goal-${goal.id}`,
          title: `${goal.name} is close`,
          detail: `${Math.round(progress * 100)}% saved so far — keep going.`,
          tone: "neutral",
        });
      }
    }

    return items.slice(0, 5);
  }, [budgets, goals, transactions, currency, plan, recurringPayments, prefs, todayKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Quiet, useful signals from your own numbers.</DialogDescription>
        </DialogHeader>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-elevated/40 px-6 py-10 text-center">
            <CircleCheck className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">You&apos;re all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No budget or goal needs your attention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex gap-3 rounded-xl border border-border bg-elevated/40 p-3.5"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    alert.tone === "warning"
                      ? "bg-danger/10 text-danger"
                      : alert.tone === "positive"
                        ? "bg-primary/10 text-primary"
                        : "bg-card text-muted-foreground",
                  )}
                >
                  {alert.tone === "neutral" ? (
                    <Info className="size-4" aria-hidden="true" />
                  ) : (
                    <Bell className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {alert.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
