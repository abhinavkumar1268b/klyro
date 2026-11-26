"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ReceiptText } from "lucide-react";
import { useMediaQuery } from "@/hooks";
import { buildMonthlyCalendar, CALENDAR_WEEKDAYS, type SpendingLevel } from "@/lib/calculations";
import { formatCompactCurrency, formatCurrency, formatMonth } from "@/lib/calculations";
import type { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface MonthlySpendingCalendarProps {
  month: string;
  transactions: Transaction[];
  categories: Array<{ id: string; name: string; icon: string }>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const LEVEL_CLASSES: Record<SpendingLevel, string> = {
  zero: "border-border bg-card/40 text-muted-foreground",
  low: "border-border bg-elevated/60 text-foreground",
  medium: "border-primary/20 bg-primary/10 text-foreground",
  high: "border-primary/40 bg-primary/20 text-primary",
};

const LEGEND: Array<{ level: SpendingLevel; label: string }> = [
  { level: "zero", label: "None" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
];

export function MonthlySpendingCalendar({
  month,
  transactions,
  categories,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}: MonthlySpendingCalendarProps) {
  const compact = useMediaQuery("(max-width: 639px)");
  const calendar = useMemo(
    () => buildMonthlyCalendar(transactions, month),
    [transactions, month],
  );
  const selected = calendar.days.find((day) => day.date === selectedDate) ?? null;
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            Monthly Spending Calendar
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatMonth(month)} · expenses recorded each day
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Previous month"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Next month"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {CALENDAR_WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="truncate text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs"
            >
              <span className="hidden sm:inline">{weekday}</span>
              <span className="sm:hidden">{weekday.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 sm:space-y-2">
          {calendar.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((day, dayIndex) => {
                if (!day.inMonth || !day.date) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="min-h-[60px] rounded-lg border border-transparent sm:min-h-[84px]"
                      aria-hidden="true"
                    />
                  );
                }

                const active = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDate(active ? null : day.date)}
                    aria-pressed={active}
                    aria-label={`${day.day} ${formatMonth(month)}, ${formatCurrency(
                      day.expenses,
                    )} spent, ${day.count} ${day.count === 1 ? "transaction" : "transactions"}`}
                    className={cn(
                      "flex min-h-[60px] flex-col items-start justify-between rounded-lg border p-1 text-left transition-all duration-200 sm:min-h-[84px] sm:p-2.5",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                        : LEVEL_CLASSES[day.level],
                      day.isToday && !active && "ring-1 ring-primary/30",
                    )}
                  >
                    <span className="text-[11px] font-medium tabular-nums sm:text-sm">
                      {day.day}
                    </span>
                    <span
                      className={cn(
                        "w-full truncate text-[9px] font-medium tabular-nums sm:text-[11px]",
                        active ? "text-primary-foreground" : day.level === "zero" ? "text-muted-foreground" : "",
                      )}
                    >
                      {compact
                        ? formatCompactCurrency(day.expenses, undefined, undefined, 0)
                        : formatCurrency(day.expenses)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Spending level
          </span>
          {LEGEND.map((item) => (
            <span key={item.level} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={cn("size-2.5 rounded-sm border", LEVEL_CLASSES[item.level])} />
              {item.label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            Based on this month&apos;s own spending
          </span>
        </div>

        <div className="border-t border-border pt-4">
          {!selected ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Select a date to see its income, spending and transactions.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selected.day} {formatMonth(month)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selected.count} {selected.count === 1 ? "transaction" : "transactions"} recorded
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/transactions?from=${selected.date}&to=${selected.date}`}
                  >
                    View day in history
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(selected.expenses)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-primary">
                    {formatCurrency(selected.income)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
                    {selected.count}
                  </p>
                </div>
              </div>

              {selected.transactions.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No transactions recorded on this day."
                  description="Income and expenses logged for this date will appear here."
                  className="border-0 bg-transparent px-0 py-6"
                />
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {[...selected.transactions]
                    .sort((a, b) => b.amount - a.amount)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground",
                            transaction.type === "income" &&
                              "border-primary/20 bg-primary/10 text-primary",
                          )}
                        >
                          <CategoryIcon name={iconFor(transaction.categoryId)} className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {transaction.title}
                            </p>
                            <Badge variant={transaction.type === "income" ? "default" : "secondary"} className="text-[10px]">
                              {transaction.type}
                            </Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {nameFor(transaction.categoryId)} · {transaction.paymentMethod ?? "Other"}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "shrink-0 text-sm font-medium tabular-nums",
                            transaction.type === "income" ? "text-primary" : "text-foreground",
                          )}
                        >
                          {transaction.type === "income" ? "+" : "−"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
