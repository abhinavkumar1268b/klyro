import { ArrowDownRight, ArrowUpRight, Minus, ReceiptText, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { InsightAnalysis } from "@/lib/calculations/insights";
import { cn } from "@/lib/utils";

export function WeeklyReview({
  analysis,
  categoryName,
}: {
  analysis: InsightAnalysis;
  categoryName: (id: string) => string;
}) {
  const review = analysis.weeklyReview;
  const comparison = review.comparison;
  const items = [
    {
      label: "Total spending",
      value: formatCurrency(review.total),
      icon: ReceiptText,
    },
    {
      label: "Daily average",
      value: formatCurrency(Math.round(review.dailyAverage)),
      icon: Wallet,
    },
    {
      label: "Budget remaining",
      value: review.budgetRemaining === null ? "No budget set" : formatCurrency(review.budgetRemaining),
      icon: Wallet,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly money review</CardTitle>
        <p className="text-xs text-muted-foreground">A quiet check-in on {analysis.range.label.toLowerCase()}.</p>
      </CardHeader>

      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-elevated/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <item.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border px-5 pb-5 pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Biggest expense</span>
          <span className="text-right text-foreground">
            {review.biggestExpense
              ? `${review.biggestExpense.title} · ${formatCurrency(review.biggestExpense.amount)}`
              : "None recorded"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Highest spending category</span>
          <span className="text-right text-foreground">
            {review.highestCategoryId ? categoryName(review.highestCategoryId) : "None recorded"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Previous week</span>
          {comparison.percentChange === null ? (
            <span className="text-xs text-muted-foreground">No prior data</span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1 text-xs tabular-nums",
                comparison.delta > 0 ? "text-danger" : comparison.delta < 0 ? "text-primary" : "text-muted-foreground",
              )}
            >
              {comparison.delta > 0 ? (
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              ) : comparison.delta < 0 ? (
                <ArrowDownRight className="size-3.5" aria-hidden="true" />
              ) : (
                <Minus className="size-3.5" aria-hidden="true" />
              )}
              {Math.abs(Math.round(comparison.percentChange))}% · {formatCurrency(Math.abs(comparison.delta))}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
