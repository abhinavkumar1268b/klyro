import { ArrowDownLeft, ArrowUpRight, CalendarDays, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { InsightAnalysis } from "@/lib/calculations/insights";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  tone: "default" | "positive" | "negative";
}

export function InsightSummaryCards({ analysis }: { analysis: InsightAnalysis }) {
  const { summary, weekly, range } = analysis;
  const stats: Stat[] = [
    {
      label: "Total expenses",
      value: formatCurrency(summary.expense),
      hint: `${summary.count} recorded entries`,
      icon: ArrowUpRight,
      tone: "default",
    },
    {
      label: "Total income",
      value: formatCurrency(summary.income),
      hint: "Across the selected period",
      icon: ArrowDownLeft,
      tone: "positive",
    },
    {
      label: "Net cash flow",
      value: formatCurrency(summary.net),
      hint: summary.net >= 0 ? "Money kept" : "Money outpaced income",
      icon: Wallet,
      tone: summary.net >= 0 ? "positive" : "negative",
    },
  ];

  if (range.mode === "weekly") {
    const comparison = weekly.comparison;
    stats.push({
      label: "Daily average",
      value: formatCurrency(Math.round(weekly.dailyAverage)),
      hint: weekly.highestDay ? `Peak: ${weekly.highestDay.label}` : "No peak day recorded",
      icon: CalendarDays,
      tone: "default",
    });
    if (comparison.hasPrevious) {
      stats.push({
        label: "vs previous week",
        value: `${comparison.delta >= 0 ? "+" : "−"}${formatCurrency(Math.abs(comparison.delta))}`,
        hint: `${Math.abs(Math.round(comparison.percentChange ?? 0))}% ${comparison.delta >= 0 ? "higher" : "lower"}`,
        icon: comparison.delta >= 0 ? ArrowUpRight : ArrowDownLeft,
        tone: comparison.delta >= 0 ? "negative" : "positive",
      });
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <stat.icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p
            className={cn(
              "mt-4 text-2xl font-semibold tracking-tight tabular-nums",
              stat.tone === "positive" ? "text-primary" : stat.tone === "negative" ? "text-danger" : "text-foreground",
            )}
          >
            {stat.value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
        </Card>
      ))}
    </div>
  );
}
