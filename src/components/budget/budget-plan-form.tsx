"use client";

/* React Hook Form's field array is intentionally used for recurring expenses. */
/* eslint-disable react-hooks/incompatible-library */

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { savePlan } from "@/features/budget";
import {
  DEFAULT_TOTAL_AVAILABLE,
  DEFAULT_SPENDING_ALLOWANCE,
  DEFAULT_PROTECTED_SAVINGS,
  WARNING_THRESHOLDS,
} from "@/constants";
import { formatCurrency, planAllocationRemaining, toMinorUnits } from "@/lib/calculations";
import { budgetPlanSchema, type BudgetPlanFormValues } from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import type { BudgetPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BudgetPlanFormProps {
  month: string;
  plan: BudgetPlan | null;
  onSaved: () => void;
}

const EMPTY_RECURRING = { label: "", amount: 0, dayOfMonth: 1, id: "" };

export function BudgetPlanForm({ month, plan, onSaved }: BudgetPlanFormProps) {
  const form = useForm<BudgetPlanFormValues>({
    resolver: zodResolver(budgetPlanSchema),
    defaultValues: {
      enabled: plan?.enabled ?? true,
      totalAvailable: plan ? plan.totalAvailable / 100 : DEFAULT_TOTAL_AVAILABLE,
      spendingAllowance: plan ? plan.spendingAllowance / 100 : DEFAULT_SPENDING_ALLOWANCE,
      protectedSavings: plan ? plan.protectedSavings / 100 : DEFAULT_PROTECTED_SAVINGS,
      thresholds: plan?.thresholds ?? [...WARNING_THRESHOLDS],
      recurringExpenses: plan
        ? plan.recurringExpenses.map((item) => ({
            label: item.label,
            amount: item.amount / 100,
            dayOfMonth: item.dayOfMonth,
            categoryId: item.categoryId,
          }))
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recurringExpenses",
  });
  const totalAvailable = form.watch("totalAvailable");
  const spendingAllowance = form.watch("spendingAllowance");
  const protectedSavings = form.watch("protectedSavings");
  const thresholds = form.watch("thresholds");
  const enabled = form.watch("enabled");

  const unallocated = planAllocationRemaining({
    month,
    enabled,
    totalAvailable: toMinorUnits(totalAvailable || 0),
    spendingAllowance: toMinorUnits(spendingAllowance || 0),
    protectedSavings: toMinorUnits(protectedSavings || 0),
    thresholds,
    recurringExpenses: [],
    updatedAt: "",
  });

  function toggleThreshold(threshold: number) {
    const next = thresholds.includes(threshold)
      ? thresholds.filter((item) => item !== threshold)
      : [...thresholds, threshold].sort((a, b) => a - b);
    form.setValue("thresholds", next, { shouldValidate: true });
  }

  async function onSubmit(values: BudgetPlanFormValues) {
    try {
      const nextPlan: BudgetPlan = {
        month,
        enabled: values.enabled,
        totalAvailable: toMinorUnits(values.totalAvailable),
        spendingAllowance: toMinorUnits(values.spendingAllowance),
        protectedSavings: toMinorUnits(values.protectedSavings),
        thresholds: [...values.thresholds].sort((a, b) => a - b),
        recurringExpenses: values.recurringExpenses.map((item) => ({
          id: `recurring-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          label: item.label.trim(),
          amount: toMinorUnits(item.amount),
          dayOfMonth: item.dayOfMonth,
          categoryId: item.categoryId,
        })),
        updatedAt: new Date().toISOString(),
      };
      await savePlan(nextPlan);
      notify({
        variant: "success",
        title: nextPlan.enabled ? "Budget plan saved" : "Budgeting switched off",
        description: "Your allocations are stored locally.",
      });
      onSaved();
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Budget plan not saved", description: "Please try again." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <button
        type="button"
        onClick={() => form.setValue("enabled", !enabled, { shouldValidate: true })}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
          enabled
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-elevated/40 hover:bg-elevated",
        )}
      >
        <span>
          <span className="block text-sm font-medium text-foreground">Budgeting</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {enabled
              ? "Track spending against a monthly allowance."
              : "Off — income, expenses and categories are still tracked."}
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-elevated",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-4 rounded-full bg-background transition-transform",
              enabled ? "translate-x-6" : "translate-x-1",
            )}
          />
        </span>
      </button>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "totalAvailable" as const, label: "Total available", hint: "Money for this month" },
          { name: "spendingAllowance" as const, label: "Spending allowance", hint: "Your flexible spend" },
          { name: "protectedSavings" as const, label: "Protected savings", hint: "Planned, not moved" },
        ].map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`plan-${field.name}`}>{field.label}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id={`plan-${field.name}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="pl-8"
                {...form.register(field.name, { valueAsNumber: true })}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{field.hint}</p>
            {form.formState.errors[field.name] ? (
              <p className="text-xs text-danger">{form.formState.errors[field.name]?.message}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-4 py-3 text-sm",
          unallocated < 0 ? "border-danger/25 bg-danger/5 text-danger" : "border-border bg-elevated/40 text-muted-foreground",
        )}
      >
        <span>Unallocated money</span>
        <span className="font-medium tabular-nums">{formatCurrency(unallocated)}</span>
      </div>

      <div className="space-y-2">
        <Label>Budget warnings</Label>
        <p className="text-xs text-muted-foreground">Alert me when spending reaches:</p>
        <div className="flex flex-wrap gap-2">
          {WARNING_THRESHOLDS.map((threshold) => {
            const active = thresholds.includes(threshold);
            return (
              <button
                key={threshold}
                type="button"
                onClick={() => toggleThreshold(threshold)}
                aria-pressed={active}
                className={cn(
                  "h-9 rounded-lg border px-4 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {threshold}%
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Upcoming recurring expenses</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reserved from your daily safe-to-spend amount when still unpaid.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...EMPTY_RECURRING })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
            No recurring expenses configured.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_5rem_4rem_2.25rem] gap-2">
                <Input
                  placeholder="e.g. Wi-Fi plan"
                  aria-label={`Recurring expense ${index + 1} name`}
                  {...form.register(`recurringExpenses.${index}.label`)}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="₹"
                  aria-label={`Recurring expense ${index + 1} amount`}
                  {...form.register(`recurringExpenses.${index}.amount`, { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Day"
                  aria-label={`Recurring expense ${index + 1} day`}
                  {...form.register(`recurringExpenses.${index}.dayOfMonth`, {
                    valueAsNumber: true,
                  })}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label={`Remove recurring expense ${index + 1}`}
                >
                  <Trash className="size-4" aria-hidden="true" />
                </button>
                {form.formState.errors.recurringExpenses?.[index] ? (
                  <p className="col-span-full text-xs text-danger">
                    Check the name, amount and day for this item.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save budget plan"}
      </Button>
    </form>
  );
}
