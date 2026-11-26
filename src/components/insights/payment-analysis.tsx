import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { PaymentBreakdown, PaymentGroup } from "@/lib/calculations/insights";

const ALL_GROUPS: PaymentGroup[] = ["Cash", "UPI", "Card", "Bank transfer", "Other"];

export function PaymentAnalysis({ data }: { data: PaymentBreakdown[] }) {
  const rows = ALL_GROUPS.map(
    (group) => data.find((item) => item.group === group) ?? { group, total: 0, count: 0, percentage: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment analysis</CardTitle>
        <p className="text-xs text-muted-foreground">Expenses by how you paid.</p>
      </CardHeader>

      <div className="space-y-4 px-5 pb-5">
        {rows.map((row) => (
          <div key={row.group} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={row.count === 0 ? "text-muted-foreground" : "text-foreground"}>
                {row.group}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(row.total)}
                <span className="ml-2 text-xs">{Math.round(row.percentage)}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
