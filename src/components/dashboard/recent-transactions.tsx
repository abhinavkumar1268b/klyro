import Link from "next/link";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/calculations";
import type { Category, Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
}

export function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";
  const dateFor = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent transactions</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Your five latest entries</p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          See all <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <div className="flex-1 px-5 pb-5">
        {recent.length === 0 ? (
          <EmptyState
            icon={ArrowUpRight}
            title="No recent activity"
            description="Your latest entries will appear here."
            className="border-0 bg-transparent px-0 py-8"
          />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((transaction) => {
              const income = transaction.type === "income";
              return (
                <div key={transaction.id} className="flex items-center gap-3 py-3.5">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground",
                      income && "border-primary/20 bg-primary/10 text-primary",
                    )}
                  >
                    <CategoryIcon name={iconFor(transaction.categoryId)} className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {transaction.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {nameFor(transaction.categoryId)} · {dateFor(transaction.date)} ·{" "}
                      {transaction.paymentMethod ?? "UPI"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "flex items-center justify-end gap-1 text-sm font-medium tabular-nums",
                        income ? "text-primary" : "text-foreground",
                      )}
                    >
                      {income ? (
                        <ArrowDownLeft className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      )}
                      {income ? "+" : "−"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {income ? "Income" : "Expense"}
                    </p>
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
