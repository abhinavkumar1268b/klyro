import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, makeComparison } from "@/lib/calculations";
import type {
  InsightRange,
  NeedWantBreakdown,
} from "@/lib/calculations/insights";
import { cn } from "@/lib/utils";
import { NeedWantChart } from "./need-want-chart";

interface NeedWantAnalysisProps {
  data: NeedWantBreakdown;
  previous: NeedWantBreakdown;
  range: InsightRange;
  entryCount: number;
}

function Comparison({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}) {
  const comparison = makeComparison(current, previous);
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
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
          {Math.abs(Math.round(comparison.percentChange))}% vs previous period
        </span>
      )}
    </div>
  );
}

export function NeedWantAnalysis({ data, previous, range, entryCount }: NeedWantAnalysisProps) {
  const classified = data.need + data.want;
  const unclassified = Math.max(0, entryCount - data.needCount - data.wantCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Need vs want</CardTitle>
        <p className="text-xs text-muted-foreground">
          Classification is optional · {range.label.toLowerCase()}
        </p>
      </CardHeader>

      <div className="space-y-5 px-5 pb-5">
        <NeedWantChart data={data} />

        {classified > 0 ? (
          <>
            <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
                <p className="text-xs text-muted-foreground">Need spending</p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(data.need)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {Math.round((data.need / classified) * 100)}% of classified spend
                </p>
              </div>
              <div className="rounded-lg border border-border bg-elevated/40 p-3.5">
                <p className="text-xs text-muted-foreground">Want spending</p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(data.want)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {Math.round((data.want / classified) * 100)}% of classified spend
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Compared with {range.previousLabel.toLowerCase()}
              </p>
              <Comparison label="Need" current={data.need} previous={previous.need} />
              <Comparison label="Want" current={data.want} previous={previous.want} />
            </div>
          </>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {unclassified} {unclassified === 1 ? "expense" : "expenses"} left unclassified and excluded
          from this split.
        </p>
      </div>
    </Card>
  );
}
