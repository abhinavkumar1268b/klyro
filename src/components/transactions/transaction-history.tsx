"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, Download, Pencil, Trash } from "lucide-react";
import { PAYMENT_METHODS, walletIdForPaymentMethod, paymentMethodForWallet } from "@/constants";
import { removeTransaction } from "@/features/transactions";
import { useCategories, useTransactions } from "@/hooks";
import {
  filterByDateRange,
  formatCurrency,
  formatDate,
  formatLocalTime,
  formatMonth,
  getMonthKey,
  summarizeCashflow,
  todayISO,
} from "@/lib/calculations";
import { downloadCSV, transactionsToCSV } from "@/lib/export";
import { useFilterStore } from "@/stores";
import type { DateRangePreset, Transaction, TransactionType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TransactionForm } from "./transaction-form";

type SortOrder = "newest" | "oldest" | "amount-desc" | "amount-asc";
type GroupMode = "day" | "month";

const TYPE_OPTIONS: SegmentOption<TransactionType | "all">[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

const GROUP_OPTIONS: SegmentOption<GroupMode>[] = [
  { value: "day", label: "Daily" },
  { value: "month", label: "Monthly" },
];

const RANGE_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
  { value: "all-time", label: "All time" },
  { value: "custom", label: "Custom range" },
];

interface TransactionHistoryProps {
  initialRange?: { from: string; to: string };
}

export function TransactionHistory({ initialRange }: TransactionHistoryProps) {
  // The server supplies the range online. Offline navigations may be served
  // from the cached document, so read the URL on the client as a fallback.
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const effectiveRange = useMemo(
    () => initialRange ?? (fromParam && toParam ? { from: fromParam, to: toParam } : undefined),
    [initialRange, fromParam, toParam],
  );

  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const {
    dateRange,
    type,
    categoryId,
    search,
    setPreset,
    setCustomRange,
    setType,
    setCategory,
    setSearch,
    reset,
  } = useFilterStore();
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [groupMode, setGroupMode] = useState<GroupMode>("day");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const appliedRange = useRef<string | null>(null);

  // A month clicked in Yearly Insights arrives here as an explicit date range.
  useEffect(() => {
    if (!effectiveRange) return;
    const valid = /^\d{4}-\d{2}-\d{2}$/;
    if (!valid.test(effectiveRange.from) || !valid.test(effectiveRange.to)) return;
    const key = `${effectiveRange.from}:${effectiveRange.to}`;
    if (appliedRange.current === key) return;
    appliedRange.current = key;
    setCustomRange(effectiveRange.from, effectiveRange.to);
  }, [effectiveRange, setCustomRange]);

  const scoped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = filterByDateRange(
      transactions.filter((transaction) => {
        if (type !== "all" && transaction.type !== type) return false;
        if (categoryId !== "all" && transaction.categoryId !== categoryId) return false;
        if (paymentMethod !== "all" && transaction.paymentMethod !== paymentMethod) return false;
        if (!query) return true;
        const categoryName = categories.find((item) => item.id === transaction.categoryId)?.name ?? "";
        return (
          transaction.title.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          (transaction.description ?? "").toLowerCase().includes(query) ||
          (transaction.paymentMethod ?? "").toLowerCase().includes(query)
        );
      }),
      dateRange,
    );

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0);
        case "amount-desc":
          return b.amount - a.amount || b.date.localeCompare(a.date);
        case "amount-asc":
          return a.amount - b.amount || b.date.localeCompare(a.date);
        default:
          return b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0);
      }
    });
  }, [transactions, categories, type, categoryId, paymentMethod, search, dateRange, sort]);

  const summary = summarizeCashflow(scoped);
  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of scoped) {
      const key = groupMode === "month" ? getMonthKey(transaction.date) : transaction.date;
      const existing = groups.get(key) ?? [];
      existing.push(transaction);
      groups.set(key, existing);
    }
    return [...groups.entries()];
  }, [scoped, groupMode]);

  const categoryName = (id: string) => categories.find((item) => item.id === id)?.name ?? id;
  const categoryIcon = (id: string) => categories.find((item) => item.id === id)?.icon ?? "Shapes";
  const walletLabel = (method?: string) => {
    const walletId = walletIdForPaymentMethod(method);
    return walletId
      ? paymentMethodForWallet(walletId as Parameters<typeof paymentMethodForWallet>[0])
      : (method ?? "Other");
  };

  function exportCSV() {
    downloadCSV(`klyro-transactions-${todayISO()}.csv`, transactionsToCSV(scoped));
  }

  function clearFilters() {
    reset();
    setPaymentMethod("all");
    setSort("newest");
    setSearch("");
  }

  async function confirmDelete() {
    if (!deleting?.id) return;
    await removeTransaction(deleting.id);
    setDeleting(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12 rounded-lg" />
        {[0, 1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Once you add an entry, your full history with filters and export will live here."
        action={
          <Button asChild size="sm">
            <Link href="/add">Add your first transaction</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">{summary.count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Money in</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(summary.income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Money out</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
              {formatCurrency(summary.expense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
              {formatCurrency(summary.net)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, category, note or method"
            aria-label="Search transactions"
          />
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              ariaLabel="Filter by type"
            />
            <SegmentedControl
              options={GROUP_OPTIONS}
              value={groupMode}
              onChange={setGroupMode}
              ariaLabel="Grouping"
              size="sm"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={categoryId}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            aria-label="Filter by payment method"
          >
            <option value="all">All payment methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Select
            value={dateRange.preset}
            onChange={(event) => setPreset(event.target.value as DateRangePreset)}
            aria-label="Filter by date range"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOrder)}
            aria-label="Sort transactions"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-desc">Amount: high to low</option>
            <option value="amount-asc">Amount: low to high</option>
          </Select>
        </div>

        {dateRange.preset === "custom" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="date"
              value={dateRange.from ?? ""}
              onChange={(event) => setCustomRange(event.target.value, dateRange.to)}
              aria-label="From date"
              className="sm:w-44"
            />
            <Input
              type="date"
              value={dateRange.to ?? ""}
              onChange={(event) => setCustomRange(dateRange.from, event.target.value)}
              aria-label="To date"
              className="sm:w-44"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={scoped.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Reset filters
          </Button>
          <p className="ml-auto self-center text-xs text-muted-foreground">
            {scoped.length} {scoped.length === 1 ? "entry" : "entries"} shown
          </p>
        </div>
      </Card>

      {scoped.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No matching transactions"
          description="Try a different search, category, payment method or date range."
          action={
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([key, items]) => {
            const totals = summarizeCashflow(items);
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {groupMode === "month" ? formatMonth(key) : formatDate(key)}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {items.length} · {formatCurrency(totals.expense)} spent
                  </p>
                </div>

                <Card className="divide-y divide-border overflow-hidden">
                  {items.map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-muted-foreground",
                          transaction.type === "income" && "border-primary/20 bg-primary/10 text-primary",
                        )}
                      >
                        <CategoryIcon name={categoryIcon(transaction.categoryId)} className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                          {transaction.type === "expense" && transaction.classification ? (
                            <Badge
                              variant={transaction.classification === "need" ? "secondary" : "outline"}
                              className="px-1.5 py-0 text-[10px] uppercase tracking-wide"
                            >
                              {transaction.classification}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {categoryName(transaction.categoryId)} · {formatDate(transaction.date)} ·{" "}
                          {formatLocalTime(transaction.createdAt)} · {walletLabel(transaction.paymentMethod)}
                        </p>
                        {transaction.description ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {transaction.description}
                          </p>
                        ) : null}
                      </div>

                      <p
                        className={cn(
                          "shrink-0 text-sm font-medium tabular-nums",
                          transaction.type === "income" ? "text-primary" : "text-foreground",
                        )}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatCurrency(transaction.amount)}
                      </p>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(transaction)}
                          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                          aria-label={`Edit ${transaction.title}`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(transaction)}
                          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`Delete ${transaction.title}`}
                        >
                          <Trash className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Update the details and save your changes.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <TransactionForm
              transaction={editing}
              submitLabel="Save changes"
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this transaction?"
        description={`“${deleting?.title ?? ""}” will be removed from your journal. This cannot be undone.`}
        confirmLabel="Delete transaction"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
