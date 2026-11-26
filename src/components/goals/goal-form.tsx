"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveGoal } from "@/features/goals";
import { goalSchema, type GoalFormValues } from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import type { Goal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ICONS = [
  { value: "Target", label: "Target" },
  { value: "ShieldCheck", label: "Shield" },
  { value: "Laptop", label: "Laptop" },
  { value: "Sparkles", label: "Sparkles" },
  { value: "GraduationCap", label: "Education" },
  { value: "House", label: "Home" },
];
const TINTS = ["lime", "blue", "violet", "amber", "rose", "neutral"];

export function GoalForm({ goal, onSaved }: { goal?: Goal; onSaved: () => void }) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal ? goal.targetAmount / 100 : undefined,
      savedAmount: goal ? goal.savedAmount / 100 : 0,
      deadline: goal?.deadline ?? "",
      icon: goal?.icon ?? "Target",
      tint: goal?.tint ?? "lime",
    },
  });

  async function onSubmit(values: GoalFormValues) {
    try {
      await saveGoal(values, goal?.id);
      notify({
        variant: "success",
        title: goal ? "Goal updated" : "Goal created",
        description: values.name,
      });
      onSaved();
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Could not create goal", description: "Please try again." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="goal-name">Goal name</Label>
        <Input id="goal-name" placeholder="e.g. Emergency fund" maxLength={80} {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goal-target">Target amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              id="goal-target"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              className="pl-8"
              {...form.register("targetAmount", { valueAsNumber: true })}
            />
          </div>
          {form.formState.errors.targetAmount ? (
            <p className="text-xs text-danger">{form.formState.errors.targetAmount.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-saved">Already saved</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
            <Input
              id="goal-saved"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              className="pl-8"
              {...form.register("savedAmount", { valueAsNumber: true })}
            />
          </div>
          {form.formState.errors.savedAmount ? (
            <p className="text-xs text-danger">{form.formState.errors.savedAmount.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-deadline">
          Target date <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="goal-deadline" type="date" {...form.register("deadline")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goal-icon">Icon</Label>
          <Select id="goal-icon" {...form.register("icon")}>
            {ICONS.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-tint">Accent</Label>
          <Select id="goal-tint" {...form.register("tint")}>
            {TINTS.map((tint) => (
              <option key={tint} value={tint}>
                {tint}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {goal ? "Save changes" : "Create goal"}
      </Button>
    </form>
  );
}
