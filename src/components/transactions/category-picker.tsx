"use client";

import { CategoryIcon } from "@/components/ui/category-icon";
import { TINT_CLASSES } from "@/constants";
import { cn } from "@/lib/utils";
import type { Category, TransactionType } from "@/types";

interface CategoryPickerProps {
  categories: Category[];
  type: TransactionType;
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategoryPicker({ categories, type, value, onChange }: CategoryPickerProps) {
  const options = categories.filter(
    (category) => category.type === type || category.type === "both",
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
      {options.map((category) => {
        const tint = TINT_CLASSES[category.tint];
        const active = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            title={category.name}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
              active
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-elevated/40 text-muted-foreground hover:bg-elevated hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md border",
                tint.background,
                tint.border,
                tint.text,
              )}
            >
              <CategoryIcon name={category.icon} className="size-4" />
            </span>
            <span className="truncate">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
