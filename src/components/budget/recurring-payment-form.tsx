"use client";

/* React Hook Form's watch() is intentionally used to reveal the confirmation. */
/* eslint-disable react-hooks/incompatible-library */

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { saveRecurringPayment } from "@/features/recurring";
import { formatCurrency, todayISO } from "@/lib/calculations";
import {
  recurringPaymentSchema,
  type RecurringPaymentFormValues,
} from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import type { Category, RecurringPayment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RecurringPaymentFormProps {
  categories: Category[];
  payment?: RecurringPayment;
  onSaved: () => void;
}

const FREQUENCIES = [
  { value: "weekly" as const, label: "Weekly" },
  { value: "monthly" as const, label: "Monthly" },
  { value: "yearly" as const, label: "Yearly" },
];

export function RecurringPaymentForm({
  categories,
  payment,
  onSaved,
}: RecurringPaymentFormProps) {
  const [understood, setUnderstood] = useState(false);
  const form = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentSchema),
    defaultValues: {
      name: payment?.name ?? "",
      amount: payment ? payment.amount / 100 : undefined,
      categoryId: payment?.categoryId ?? categories[0]?.id ?? "bills",
      frequency: payment?.frequency ?? "monthly",
      nextDueDate: payment?.nextDueDate ?? todayISO(),
      reminderDays: payment?.reminderDays ?? 3,
      autoRecord: payment?.autoRecord ?? false,
    },
  });

  const autoRecord = form.watch("autoRecord");
  const expenseCategories = categories.filter(
    (category) => category.type === "expense" || category.type === "both",
  );

  async function onSubmit(values: RecurringPaymentFormValues) {
    if (values.autoRecord && !understood) {
      notify({
        variant: "error",
        title: "Confirmation required",
        description: "Tick the understanding box before enabling automatic recording.",
      });
      return;
    }
    try {
      await saveRecurringPayment(values, payment?.id);
      notify({
        variant: "success",
        title: payment ? "Reminder updated" : "Reminder created",
        description: `${values.name} · ${formatCurrency(Math.round(values.amount * 100))}`,
      });
      onSaved();
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Reminder not saved", description: "Please try again." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reminder-name">Name</Label>
        <Input id="reminder-name" placeholder="e.g. Rent" maxLength={80} {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reminder-amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              id="reminder-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              className="pl-8"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          {form.formState.errors.amount ? (
            <p className="text-xs text-danger">{form.formState.errors.amount.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder-category">Category</Label>
          <Select id="reminder-category" {...form.register("categoryId")}>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="reminder-frequency">Frequency</Label>
          <Select id="reminder-frequency" {...form.register("frequency")}>
            {FREQUENCIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder-date">Next due date</Label>
          <Input id="reminder-date" type="date" {...form.register("nextDueDate")} />
          {form.formState.errors.nextDueDate ? (
            <p className="text-xs text-danger">{form.formState.errors.nextDueDate.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder-days">Remind days before</Label>
          <Input
            id="reminder-days"
            type="number"
            min="0"
            max="30"
            {...form.register("reminderDays", { valueAsNumber: true })}
          />
          {form.formState.errors.reminderDays ? (
            <p className="text-xs text-danger">{form.formState.errors.reminderDays.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-elevated/40 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[#B9F36B]"
            {...form.register("autoRecord")}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Automatically record as an expense when due
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              Off by default. KLYRO will only add this payment to your journal when you choose this
              option; otherwise you record it yourself with “Mark as paid”.
            </span>
          </span>
        </label>

        {autoRecord ? (
          <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[#B9F36B]"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I understand that enabling this will create an expense entry automatically on the due
              date.
            </span>
          </label>
        ) : null}

        <p className={cn("flex items-start gap-2 text-xs text-muted-foreground")}>
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Reminders stay in this browser. Nothing is charged or sent anywhere.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : payment ? "Save reminder" : "Create reminder"}
      </Button>
    </form>
  );
}
