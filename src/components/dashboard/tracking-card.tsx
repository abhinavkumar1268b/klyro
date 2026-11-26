import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  expensesInMonth,
  formatCurrency,
  incomeInMonth,
  paymentMethodBreakdown,
  totalsByCategory,
} from "@/lib/calculations";
import type { Category, Transaction } from "@/types";

interface TrackingCardProps {
  month: string;
  transactions: Transaction[];
  categories: Category[];
}

/** Shown when budgeting is off — tracking continues without an allowance. */
export function TrackingCard({ month, transactions, categories }: TrackingCardProps) {
  const scoped = transactions.filter((transaction) => transaction.date.startsWith(month));
  const topCategories = totalsByCategory(scoped).slice(0, 3);
  const methods = paymentMethodBreakdown(scoped).slice(0, 3);
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ChartNoAxesCombined className="size-4 text-muted-foreground" aria-hidden="true" />
            Tracking without a budget
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Income, spending and categories are still recorded.
          </p>
        </div>
        <Link
          href="/budget"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          Set up <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Income</span>
            <span className="font-medium tabular-nums text-primary">
              {formatCurrency(incomeInMonth(transactions, month))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total spending</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(expensesInMonth(transactions, month))}
            </span>
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Top categories
            </p>
            {topCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground">No expenses yet.</p>
            ) : (
              topCategories.map((item) => (
                <div key={item.categoryId} className="flex items-center gap-2 text-xs">
                  <CategoryIcon name={iconFor(item.categoryId)} className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">{nameFor(item.categoryId)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2 sm:border-l sm:border-border sm:pl-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Payment methods
          </p>
          {methods.length === 0 ? (
            <p className="text-xs text-muted-foreground">No methods recorded yet.</p>
          ) : (
            methods.map((method) => (
              <div key={method.method} className="flex justify-between text-xs">
                <span className="text-foreground">{method.method}</span>
                <span className="tabular-nums text-muted-foreground">
                  {method.count} · {formatCurrency(method.total)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
