"use client";

/* React Hook Form's watch() is intentionally used for the live preview. */
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownLeft, ArrowUpRight, Check, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { saveTransaction } from "@/features/transactions";
import {
  useCategories,
  useCurrentDate,
  useTransactions,
  useWalletAdjustments,
  useWalletTransfers,
  useWallets,
} from "@/hooks";
import {
  CLASSIFICATION_OPTIONS,
  paymentMethodForWallet,
  walletIdForPaymentMethod,
} from "@/constants";
import type { PaymentMethod } from "@/constants/transactions";
import {
  formatCurrency,
  summarizeWallet,
  toMinorUnits,
  todayISO,
} from "@/lib/calculations";
import { transactionSchema, type TransactionFormValues } from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Transaction, TransactionClassification, TransactionType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CategoryPicker } from "./category-picker";
import { TransactionTypeBadge } from "./transaction-type-badge";

interface TransactionFormProps {
  transaction?: Transaction;
  showPreview?: boolean;
  submitLabel?: string;
  onSaved?: (values: TransactionFormValues) => void;
}

const TYPE_OPTIONS = [
  { value: "expense" as TransactionType, label: "Expense", icon: ArrowUpRight },
  { value: "income" as TransactionType, label: "Income", icon: ArrowDownLeft },
];

const CLASSIFICATION_SEGMENTS = CLASSIFICATION_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function TransactionForm({
  transaction,
  showPreview = false,
  submitLabel = "Save transaction",
  onSaved,
}: TransactionFormProps) {
  const { data: categories, isLoading } = useCategories();
  const { data: wallets } = useWallets();
  const { data: walletTransfers } = useWalletTransfers();
  const { data: walletAdjustments } = useWalletAdjustments();
  const { data: allTransactions } = useTransactions();
  const currentDate = useCurrentDate();
  const preferredClassification = useSettingsStore((state) => state.defaultClassification);
  const [insufficient, setInsufficient] = useState<{
    available: number;
    amount: number;
    walletName: string;
    values: TransactionFormValues;
  } | null>(null);

  const walletSummaries = wallets.map((wallet) =>
    summarizeWallet(wallet, allTransactions, walletTransfers, walletAdjustments),
  );
  const enabledMethods = wallets
    .filter((wallet) => wallet.enabled)
    .map((wallet) => paymentMethodForWallet(wallet.id as Parameters<typeof paymentMethodForWallet>[0]));
  const paymentOptions = [
    ...enabledMethods,
    ...(transaction?.paymentMethod &&
    !enabledMethods.includes(transaction.paymentMethod as PaymentMethod)
      ? [transaction.paymentMethod as PaymentMethod]
      : []),
  ].filter((method, index, items) => items.indexOf(method) === index);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? "expense",
      amount: transaction ? transaction.amount / 100 : undefined,
      categoryId: transaction?.categoryId ?? "food",
      title: transaction?.title ?? "",
      description: transaction?.description ?? "",
      date: transaction?.date ?? todayISO(),
      paymentMethod:
        (transaction?.paymentMethod as PaymentMethod | undefined) ??
        paymentMethodForWallet("upi"),
      classification:
        transaction?.classification ??
        (transaction?.type === "income" ? undefined : preferredClassification),
    },
  });

  const type = form.watch("type");
  const amount = form.watch("amount");
  const categoryId = form.watch("categoryId");
  const title = form.watch("title");
  const description = form.watch("description");
  const date = form.watch("date");
  const paymentMethod = form.watch("paymentMethod");
  const classification = form.watch("classification");

  useEffect(() => {
    const valid = categories.some(
      (category) => category.id === categoryId && (category.type === type || category.type === "both"),
    );
    if (!valid && categories.length > 0) {
      const first = categories.find(
        (category) => category.type === type || category.type === "both",
      );
      if (first) form.setValue("categoryId", first.id);
    }
  }, [categories, categoryId, type, form]);

  // Keep a fresh form on today's local date across midnight, but never
  // override a date the user intentionally selected.
  const dateTouched = form.formState.dirtyFields.date;
  useEffect(() => {
    if (!currentDate || transaction || dateTouched) return;
    if (form.getValues("date") !== currentDate.dateKey) {
      form.setValue("date", currentDate.dateKey);
    }
  }, [currentDate, dateTouched, transaction, form]);

  function handleTypeChange(value: TransactionType) {
    form.setValue("type", value, { shouldValidate: true });
    form.setValue(
      "classification",
      value === "expense" ? preferredClassification : undefined,
      { shouldValidate: true },
    );
  }

  async function performSave(values: TransactionFormValues) {
    try {
      await saveTransaction(values, transaction?.id);
      notify({
        variant: "success",
        title: transaction ? "Transaction updated" : "Transaction saved",
        description: `${values.title} · ${formatCurrency(toMinorUnits(values.amount))}`,
      });
      form.reset({
        type: values.type,
        amount: undefined,
        categoryId: values.categoryId,
        title: "",
        description: "",
        date: values.date,
        paymentMethod: values.paymentMethod,
        classification: values.type === "expense" ? preferredClassification : undefined,
      });
      onSaved?.(values);
    } catch (error) {
      console.error("KLYRO could not save the transaction", error);
      notify({
        variant: "error",
        title: "Transaction not saved",
        description: "Something went wrong writing to local storage. Please try again.",
      });
    }
  }

  async function onSubmit(values: TransactionFormValues) {
    const amount = toMinorUnits(values.amount);
    const walletId = walletIdForPaymentMethod(values.paymentMethod);
    const summary = walletSummaries.find((item) => item.wallet.id === walletId);

    if (values.type === "expense" && summary) {
      const oldAmount =
        transaction?.type === "expense" &&
        walletIdForPaymentMethod(transaction.paymentMethod) === walletId
          ? transaction.amount
          : 0;
      const available = summary.balance + oldAmount;
      if (amount > available) {
        setInsufficient({ available, amount, walletName: summary.wallet.name, values });
        return;
      }
    }

    await performSave(values);
  }

  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("grid gap-6", showPreview && "lg:grid-cols-[1.4fr_1fr]")}
    >
      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label>Transaction type</Label>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleTypeChange}
            ariaLabel="Transaction type"
            className="w-full sm:w-auto"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              ₹
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="100000000"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              autoFocus={!transaction}
              className="h-16 pl-10 text-3xl font-semibold tabular-nums"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          {form.formState.errors.amount ? (
            <p className="text-xs text-danger">{form.formState.errors.amount.message}</p>
          ) : null}
        </div>

        {type === "expense" ? (
          <div className="space-y-2">
            <Label>Classification</Label>
            <SegmentedControl
              options={CLASSIFICATION_SEGMENTS}
              value={(classification ?? "need") as TransactionClassification}
              onChange={(value) =>
                form.setValue("classification", value as TransactionClassification, {
                  shouldValidate: true,
                })
              }
              ariaLabel="Need or want"
              size="sm"
              className="w-full sm:w-auto"
            />
            {form.formState.errors.classification ? (
              <p className="text-xs text-danger">{form.formState.errors.classification.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="title">{type === "income" ? "Income source" : "Transaction title"}</Label>
          <Input
            id="title"
            placeholder={type === "income" ? "e.g. Freelancing" : "e.g. Coffee at Third Wave"}
            maxLength={120}
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <CategoryPicker
              categories={categories}
              type={type}
              value={categoryId}
              onChange={(id) => form.setValue("categoryId", id, { shouldValidate: true })}
            />
          )}
          {form.formState.errors.categoryId ? (
            <p className="text-xs text-danger">{form.formState.errors.categoryId.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment-method">
              {type === "income" ? "Received In" : "Paid Using"}
            </Label>
            <Select id="payment-method" {...form.register("paymentMethod")}>
              {paymentOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
            {form.formState.errors.paymentMethod ? (
              <p className="text-xs text-danger">{form.formState.errors.paymentMethod.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Transaction date</Label>
            <Input
              id="date"
              type="date"
              max={currentDate?.dateKey ?? todayISO()}
              {...form.register("date")}
            />
            {form.formState.errors.date ? (
              <p className="text-xs text-danger">{form.formState.errors.date.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <textarea
            id="description"
            rows={2}
            placeholder="Anything worth remembering…"
            maxLength={500}
            className="w-full resize-none rounded-lg border border-input bg-elevated/60 px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            {...form.register("description")}
          />
          {form.formState.errors.description ? (
            <p className="text-xs text-danger">{form.formState.errors.description.message}</p>
          ) : null}
        </div>

        <div className="sticky bottom-[4.75rem] z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving…" : submitLabel}
            <Check className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </p>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <TransactionTypeBadge type={type} />
              <span className="text-xs text-muted-foreground">
                {date
                  ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </span>
            </div>
            <p
              className={cn(
                "text-3xl font-semibold tracking-tight tabular-nums",
                type === "income" ? "text-primary" : "text-foreground",
              )}
            >
              {formatCurrency(toMinorUnits(Number(amount) || 0))}
            </p>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Title</span>
                <span className="truncate text-right text-foreground">{title || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Category</span>
                <span className="text-right text-foreground">{selectedCategory?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Wallet</span>
                <span className="text-right text-foreground">{paymentMethod || "—"}</span>
              </div>
              {type === "expense" ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Class</span>
                  <span className="text-right capitalize text-foreground">
                    {classification ?? "—"}
                  </span>
                </div>
              ) : null}
              {description ? (
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Note</span>
                  <span className="truncate text-right text-foreground">{description}</span>
                </div>
              ) : null}
            </div>
            <div className="flex gap-2 rounded-lg border border-border bg-elevated/40 p-3">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Saved privately in this browser. You&apos;ll see every dashboard figure update immediately.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={insufficient !== null}
        onOpenChange={(open) => !open && setInsufficient(null)}
        title={`Not enough money in ${insufficient?.walletName ?? "this wallet"}`}
        description={`This expense is ${formatCurrency(
          insufficient?.amount ?? 0,
        )} but ${insufficient?.walletName ?? "the wallet"} has ${formatCurrency(
          insufficient?.available ?? 0,
        )} available. No other wallet will be used. Continue only if you want an overdrawn wallet.`}
        confirmLabel="Spend anyway"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (insufficient) await performSave(insufficient.values);
          setInsufficient(null);
        }}
      />
    </form>
  );
}
