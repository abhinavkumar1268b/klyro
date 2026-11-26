import { Info } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { SafeToSpendResult } from "@/lib/calculations/budget";
import { cn } from "@/lib/utils";

export function SafeToSpendCard({ result }: { result: SafeToSpendResult }) {
  const available = result.status === "available";
  const calculation = `${formatCurrency(result.remaining)} remaining - ${formatCurrency(
    result.upcomingRecurring,
  )} recurring = ${formatCurrency(result.remaining - result.upcomingRecurring)} over ${
    result.daysLeft
  } ${result.daysLeft === 1 ? "day" : "days"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Safe to spend today
          <span className="group relative inline-flex">
            <button
              type="button"
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label="How this is calculated"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-elevated p-3 text-xs leading-relaxed text-muted-foreground opacity-0 shadow-xl shadow-black/40 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {calculation}. Pending recurring expenses are reserved first. The allowance resets
              each day.
            </span>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">A pace that keeps you inside your plan.</p>
      </CardHeader>

      <div className="px-5 pb-5">
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            available ? "text-primary" : "text-foreground",
          )}
        >
          {available ? formatCurrency(result.amount) : "No allowance"}
        </p>
        <p className="mt-1.5 text-sm text-foreground">
          {available ? "available today." : result.explanation}
        </p>
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          {result.daysLeft} {result.daysLeft === 1 ? "day" : "days"} left · recurring reserves{" "}
          {formatCurrency(result.upcomingRecurring)}
        </p>
      </div>
    </Card>
  );
}
