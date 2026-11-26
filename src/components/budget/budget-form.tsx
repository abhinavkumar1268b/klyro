"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveBudget } from "@/features/budget";
import { budgetSchema, type BudgetFormValues } from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface BudgetFormProps {
  month: string;
  categories: Category[];
  defaultValues?: BudgetFormValues;
  onSaved: () => void;
}

export function BudgetForm({ month, categories, defaultValues, onSaved }: BudgetFormProps) {
  const options = categories.filter((category) => category.type === "expense" || category.type === "both");
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: defaultValues ?? {
      categoryId: options[0]?.id ?? "",
      month,
      amount: undefined,
    },
  });

  async function onSubmit(values: BudgetFormValues) {
    try {
      await saveBudget({ ...values, month });
      const label = categories.find((item) => item.id === values.categoryId)?.name ?? "Category";
      notify({
        variant: "success",
        title: "Budget saved",
        description: `${label} · ${month}`,
      });
      onSaved();
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not save budget", description: "Please try again." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="budget-category">Category</Label>
        <Select
          id="budget-category"
          {...form.register("categoryId")}
          disabled={defaultValues !== undefined}
        >
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {form.formState.errors.categoryId ? (
          <p className="text-xs text-danger">{form.formState.errors.categoryId.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-amount">Monthly limit</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ₹
          </span>
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            className="pl-8"
            {...form.register("amount", { valueAsNumber: true })}
          />
        </div>
        {form.formState.errors.amount ? (
          <p className="text-xs text-danger">{form.formState.errors.amount.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {defaultValues ? "Save changes" : "Set budget"}
      </Button>
    </form>
  );
}
