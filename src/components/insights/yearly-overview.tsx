import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { MonthStats } from "@/lib/calculations/insights";
import { cn } from "@/lib/utils";

interface YearlyOverviewProps {
  months: MonthStats[];
  year: number;
}

function monthBounds(key: string) {
  const [year, month] = key.split("-").map(Number);
  const from = `${key}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  return { from, to: `${key}-${String(lastDay).padStart(2, "0")}` };
}

export function YearlyOverview({ months, year }: YearlyOverviewProps) {
  const totals = months.reduce(
    (acc, month) => ({
      income: acc.income + month.income,
      expense: acc.expense + month.expense,
      net: acc.net + month.net,
    }),
    { income: 0, expense: 0, net: 0 },
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-4">
        <div>
          <CardTitle>{year} at a glance</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a month to open its full transaction history.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Net for the year</p>
          <p
            className={cn(
              "mt-1 text-lg font-semibold tabular-nums",
              totals.net >= 0 ? "text-primary" : "text-danger",
            )}
          >
            {formatCurrency(totals.net)}
          </p>
        </div>
      </CardHeader>

      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((month) => {
          const bounds = monthBounds(month.key);
          return (
            <Link
              key={month.key}
              href={`/transactions?from=${bounds.from}&to=${bounds.to}`}
              className="group rounded-xl border border-border bg-elevated/40 p-4 transition-colors hover:border-primary/30 hover:bg-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{month.label}</span>
                <ArrowUpRight
                  className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">
                {formatCurrency(month.expense)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                spent · {formatCurrency(month.income)} in
              </p>
              <p
                className={cn(
                  "mt-3 border-t border-border pt-2 text-xs tabular-nums",
                  month.net >= 0 ? "text-primary" : "text-danger",
                )}
              >
                {month.net >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(month.net))} net
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
