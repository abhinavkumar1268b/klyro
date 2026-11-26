"use client";

/* React Hook Form's watch() is intentionally used for the icon selection. */
/* eslint-disable react-hooks/incompatible-library */

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { CATEGORY_ICONS } from "@/constants/categories";
import { saveCategory, removeCategory } from "@/features/categories";
import { useCategories } from "@/hooks";
import { categorySchema, type CategoryFormValues } from "@/lib/validation";
import { notify } from "@/stores/toast-store";
import type { Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./settings-section";

function CategoryForm({
  category,
  onSaved,
}: {
  category?: Category;
  onSaved: () => void;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "expense",
      icon: category?.icon ?? "Shapes",
      tint: category?.tint ?? "neutral",
    },
  });
  const icon = form.watch("icon");

  async function onSubmit(values: CategoryFormValues) {
    try {
      await saveCategory(values, category?.id);
      notify({ variant: "success", title: category ? "Category updated" : "Category created" });
      onSaved();
    } catch (error) {
      console.error(error);
      notify({ variant: "error", title: "Category not saved" });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input id="category-name" maxLength={40} {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-type">Type</Label>
          <Select id="category-type" {...form.register("type")}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-tint">Accent</Label>
          <Select id="category-tint" {...form.register("tint")}>
            {["neutral", "lime", "blue", "violet", "amber", "rose"].map((tint) => (
              <option key={tint} value={tint}>
                {tint}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {CATEGORY_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => form.setValue("icon", name)}
              aria-label={`${name} icon`}
              aria-pressed={icon === name}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg border transition-colors",
                icon === name
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <CategoryIcon name={name} className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {category ? "Save category" : "Create category"}
      </Button>
    </form>
  );
}

export function CategorySettings() {
  const { data: categories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    await removeCategory(deleting.id);
    setDeleting(null);
  }

  return (
    <SettingsSection
      title="Categories"
      description="Create, rename, re-icon or remove categories used by your journal."
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            New category
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-elevated/40 px-3 py-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                <CategoryIcon name={category.icon} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{category.name}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {category.type}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(category);
                  setFormOpen(true);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
                aria-label={`Edit ${category.name}`}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(category)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                aria-label={`Delete ${category.name}`}
              >
                <Trash className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Choose an icon and where the category applies.</DialogDescription>
          </DialogHeader>
          <CategoryForm category={editing ?? undefined} onSaved={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this category?"
        description="Existing transactions keep their category id, but the category will no longer appear in your lists."
        confirmLabel="Delete category"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </SettingsSection>
  );
}
