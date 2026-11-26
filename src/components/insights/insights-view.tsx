"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  RotateCcw,
} from "lucide-react";
import {
  useBudgetPlan,
  useBudgetPlans,
  useCategories,
  useGoals,
  useTransactions,
} from "@/hooks";
import { useCurrentDate, useMounted } from "@/hooks";
import {
  analyzeInsights,
  localMonthKey,
  parseLocalDateKey,
  type InsightMode,
} from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryAnalysis } from "./category-analysis";
import { DailySpendingChart } from "./daily-spending-chart";
import { InsightStatements } from "./insight-statements";
import { InsightSummaryCards } from "./insight-summary-cards";
import { MonthlySpendingCalendar } from "./monthly-spending-calendar";
import { NeedWantAnalysis } from "./need-want-analysis";
import { PaymentAnalysis } from "./payment-analysis";
import { ProgressCard } from "./progress-card";
import { WeeklyReview } from "./weekly-review";
import { YearlyOverview } from "./yearly-overview";

const MODES: SegmentOption<InsightMode>[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

export function InsightsView() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const { data: goals } = useGoals();
  const { data: plans } = useBudgetPlans();
  const mounted = useMounted();
  const currentDate = useCurrentDate();
  const [mode, setMode] = useState<InsightMode>("monthly");
  const [anchor, setAnchor] = useState(() => new Date());
  const [followingToday, setFollowingToday] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [custom, setCustom] = useState(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const today = `${monthStart.slice(0, 8)}${String(now.getDate()).padStart(2, "0")}`;
    return { from: monthStart, to: today };
  });

  // While following today, midnight rollover or a timezone change moves the
  // analysis to the new local day. Manual navigation opts out until "Today".
  const activeAnchor =
    followingToday && currentDate ? parseLocalDateKey(currentDate.dateKey) : anchor;
  const selectedMonth = localMonthKey(activeAnchor);
  const { data: plan } = useBudgetPlan(selectedMonth);

  const analysis = useMemo(
    () =>
      analyzeInsights(transactions, {
        mode,
        anchor: activeAnchor,
        custom,
        categories: categories.map((category) => ({ id: category.id, name: category.name })),
        goals,
        plan,
      }),
    [transactions, categories, goals, plan, mode, activeAnchor, custom],
  );

  function shiftAnchor(delta: number) {
    const next = new Date(activeAnchor);
    if (mode === "daily") next.setDate(next.getDate() + delta);
    else if (mode === "weekly") next.setDate(next.getDate() + delta * 7);
    else if (mode === "monthly") next.setMonth(next.getMonth() + delta);
    else next.setFullYear(next.getFullYear() + delta);
    setAnchor(next);
    setFollowingToday(false);
  }

  if (!mounted || isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ChartNoAxesCombined}
        title="Nothing to analyse yet"
        description="Insights appear once you have a few entries. Start with one income and one expense."
        action={
          <Button asChild size="sm">
            <Link href="/add">Add your first entry</Link>
          </Button>
        }
      />
    );
  }

  const yearly = mode === "yearly";
  const daily = mode === "daily";
  const monthly = mode === "monthly";
  const activeSelectedDate =
    selectedDate && selectedDate.startsWith(selectedMonth) ? selectedDate : null;
  const categoryData = categories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SegmentedControl
          options={MODES}
          value={mode}
          onChange={setMode}
          ariaLabel="Insight period"
          size="sm"
          className="flex-wrap"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!monthly ? (
            <>
              <button
                type="button"
                onClick={() => shiftAnchor(-1)}
                disabled={mode === "custom"}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                aria-label="Previous period"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <p className="min-w-40 text-center text-sm font-medium text-foreground">
                {analysis.range.label}
              </p>
              <button
                type="button"
                onClick={() => shiftAnchor(1)}
                disabled={mode === "custom"}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-elevated/40 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                aria-label="Next period"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setAnchor(new Date());
              setFollowingToday(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-elevated/40 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Jump to today"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Today
          </button>
        </div>
      </div>

      {mode === "custom" ? (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={(event) => setCustom((previous) => ({ ...previous, from: event.target.value }))}
            aria-label="Custom range start"
            className="sm:w-48"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={custom.to}
            min={custom.from}
            onChange={(event) => setCustom((previous) => ({ ...previous, to: event.target.value }))}
            aria-label="Custom range end"
            className="sm:w-48"
          />
          <p className="ml-auto text-xs text-muted-foreground">
            Compared with {analysis.range.previousLabel.toLowerCase()}
          </p>
        </Card>
      ) : null}

      {yearly ? (
        <>
          <InsightSummaryCards analysis={analysis} />
          <YearlyOverview months={analysis.months} year={anchor.getFullYear()} />
          <InsightStatements statements={analysis.insights} />
        </>
      ) : (
        <>
          {monthly ? (
            <MonthlySpendingCalendar
              month={selectedMonth}
              transactions={analysis.transactions}
              categories={categoryData}
              selectedDate={activeSelectedDate}
              onSelectDate={setSelectedDate}
              onPreviousMonth={() => shiftAnchor(-1)}
              onNextMonth={() => shiftAnchor(1)}
            />
          ) : null}

          <InsightSummaryCards analysis={analysis} />

          {!daily ? (
            <Card>
              <CardHeader>
                <CardTitle>Daily spending</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Expenses recorded each day in {analysis.range.label.toLowerCase()}.
                </p>
              </CardHeader>
              <CardContent>
                <DailySpendingChart data={analysis.trend} />
              </CardContent>
            </Card>
          ) : null}

          <CategoryAnalysis
            items={analysis.categories}
            categories={categoryData}
            previousLabel={analysis.range.previousLabel}
          />

          {mode === "weekly" ? (
            <WeeklyReview
              analysis={analysis}
              categoryName={(id) => categoryData.find((item) => item.id === id)?.name ?? id}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <PaymentAnalysis data={analysis.payments} />
            <NeedWantAnalysis
              data={analysis.needWant}
              previous={analysis.previousNeedWant}
              range={analysis.range}
              entryCount={analysis.transactions.filter((item) => item.type === "expense").length}
            />
          </div>

          <ProgressCard
            transactions={transactions}
            plan={plan}
            plans={plans}
            goals={goals}
          />

          <InsightStatements statements={analysis.insights} />
        </>
      )}
    </div>
  );
}
