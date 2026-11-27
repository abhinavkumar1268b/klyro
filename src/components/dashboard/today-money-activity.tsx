import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, ReceiptText } from "lucide-react";
import { paymentMethodForWallet, walletIdForPaymentMethod } from "@/constants/wallets";
import { formatCurrency, type DailyMoneyActivity } from "@/lib/calculations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalTime } from "@/components/ui/local-time";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface TodayMoneyActivityProps {
  activity: DailyMoneyActivity;
  categories: Category[];
  dateLabel: string;
}

export function TodayMoneyActivity({ activity, categories, dateLabel }: TodayMoneyActivityProps) {
  const nameFor = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const iconFor = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";
  const walletLabel = (method?: string) => {
    const id = walletIdForPaymentMethod(method);
    return id ? (paymentMethodForWallet(id as Parameters<typeof paymentMethodForWallet>[0])) : (method ?? "Other");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-3">
        <div>
          <CardTitle>Today&apos;s money activity</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/transactions">
            See all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Money received today
              </p>
              <ArrowDownLeft className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-primary tabular-nums">
              +{formatCurrency(activity.income)}
            </p>
          </div>
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Money spent today
              </p>
              <ArrowUpRight className="size-4 text-danger" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-danger tabular-nums">
              −{formatCurrency(activity.expense)}
            </p>
          </div>
        </div>

        {activity.transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No money activity today"
            description="Income and expenses recorded today will appear here."
            action={
              <Button asChild size="sm">
                <Link href="/add">Add an entry</Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {[...activity.transactions]
              .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
              .map((transaction) => {
                const income = transaction.type === "income";
                return (
                  <div key={transaction.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground",
                        income && "border-primary/20 bg-primary/10 text-primary",
                      )}
                    >
                      <CategoryIcon name={iconFor(transaction.categoryId)} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {transaction.title}
                        </p>
                        <Badge variant={income ? "default" : "secondary"} className="text-[10px]">
                          {income ? "Income" : "Expense"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {nameFor(transaction.categoryId)} · {walletLabel(transaction.paymentMethod)} ·{" "}
                        <LocalTime timestamp={transaction.createdAt} />
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        income ? "text-primary" : "text-danger",
                      )}
                    >
                      {income ? "+" : "−"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
