import type { Category } from "@/types";

/**
 * Default categories. Ids are stable because transactions reference them;
 * existing records are migrated when the category set changes.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", type: "expense", icon: "UtensilsCrossed", tint: "amber", isDefault: true },
  { id: "travel", name: "Travel", type: "expense", icon: "CarFront", tint: "blue", isDefault: true },
  { id: "shopping", name: "Shopping", type: "expense", icon: "ShoppingBag", tint: "violet", isDefault: true },
  { id: "bills", name: "Bills", type: "expense", icon: "ReceiptText", tint: "neutral", isDefault: true },
  { id: "education", name: "Education", type: "expense", icon: "GraduationCap", tint: "blue", isDefault: true },
  { id: "entertainment", name: "Entertainment", type: "expense", icon: "Clapperboard", tint: "rose", isDefault: true },
  { id: "health", name: "Health", type: "expense", icon: "HeartPulse", tint: "rose", isDefault: true },
  { id: "personal-care", name: "Personal Care", type: "expense", icon: "Bath", tint: "violet", isDefault: true },
  { id: "groceries", name: "Groceries", type: "expense", icon: "ShoppingBasket", tint: "amber", isDefault: true },
  { id: "other-expense", name: "Other", type: "expense", icon: "Shapes", tint: "neutral", isDefault: true },
  { id: "salary", name: "Salary", type: "income", icon: "BriefcaseBusiness", tint: "lime", isDefault: true },
  { id: "allowance", name: "Allowance", type: "income", icon: "HandCoins", tint: "lime", isDefault: true },
  { id: "freelance", name: "Freelance", type: "income", icon: "Laptop", tint: "lime", isDefault: true },
  { id: "scholarship", name: "Scholarship", type: "income", icon: "Award", tint: "lime", isDefault: true },
  { id: "business", name: "Business", type: "income", icon: "Store", tint: "lime", isDefault: true },
  { id: "gift", name: "Gift", type: "income", icon: "Gift", tint: "lime", isDefault: true },
  { id: "other-income", name: "Other", type: "income", icon: "CircleDollarSign", tint: "neutral", isDefault: true },
];

export const CATEGORY_ICONS = [
  "UtensilsCrossed",
  "ShoppingBasket",
  "CarFront",
  "ShoppingBag",
  "ReceiptText",
  "GraduationCap",
  "Clapperboard",
  "HeartPulse",
  "Bath",
  "Shapes",
  "BriefcaseBusiness",
  "HandCoins",
  "Laptop",
  "Award",
  "Store",
  "Gift",
  "CircleDollarSign",
  "ShieldCheck",
  "Sparkles",
  "Target",
] as const;

export const TINT_CLASSES: Record<
  Category["tint"],
  { text: string; background: string; border: string }
> = {
  neutral: {
    text: "text-muted-foreground",
    background: "bg-elevated",
    border: "border-border",
  },
  lime: {
    text: "text-primary",
    background: "bg-primary/10",
    border: "border-primary/20",
  },
  blue: {
    text: "text-sky-300",
    background: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  violet: {
    text: "text-violet-300",
    background: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  amber: {
    text: "text-amber-300",
    background: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  rose: {
    text: "text-rose-300",
    background: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
};
