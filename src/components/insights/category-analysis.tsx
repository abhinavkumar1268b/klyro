import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { CategoryAnalysis as CategoryAnalysisItem } from "@/lib/calculations/insights";
import { cn } from "@/lib/utils";

interface CategoryAnalysisProps {
  items: CategoryAnalysisItem[];
  categories: Array<{ id: string; name: string; icon: string }>;
  previousLabel: string;
}

export function CategoryAnalysis({ items, categories, previousLabel }: CategoryAnalysisProps) {
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category analysis</CardTitle>
        <p className="text-xs text-muted-foreground">Where your spending went, versus {previousLabel.toLowerCase()}.</p>
      </CardHeader>

      <div className="px-5 pb-5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No category spending in this period.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const change = item.comparison.percentChange;
              const increased = change !== null && change > 0;
              const decreased = change !== null && change < 0;
              return (
                <div key={item.categoryId} className="flex items-center gap-3 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground">
                    <CategoryIcon name={iconFor(item.categoryId)} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {nameFor(item.categoryId)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {Math.round(item.percentage)}% of spending · {item.count}{" "}
                      {item.count === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(item.total)}
                  </p>
                  <div className="hidden w-28 shrink-0 justify-end sm:flex">
                    {change === null ? (
                      <span className="text-xs text-muted-foreground">No prior data</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs tabular-nums",
                          increased ? "text-danger" : decreased ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {increased ? (
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        ) : decreased ? (
                          <ArrowDownRight className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Minus className="size-3.5" aria-hidden="true" />
                        )}
                        {Math.abs(Math.round(change))}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
