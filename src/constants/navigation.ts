import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  CirclePlus,
  House,
  Settings2,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", description: "Your money at a glance", icon: House },
  {
    label: "Insights",
    href: "/insights",
    description: "Patterns behind your spending",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Transactions",
    href: "/transactions",
    description: "Every rupee, accounted for",
    icon: ArrowLeftRight,
  },
  { label: "Savings Goals", href: "/goals", description: "Save with purpose", icon: Target },
  { label: "Budget", href: "/budget", description: "Spend with intention", icon: Wallet },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  description: "Make KLYRO yours",
  icon: Settings2,
};

export interface BottomNavItem extends NavItem {
  primary?: boolean;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: "Home", href: "/", description: "Home", icon: House },
  { label: "Insights", href: "/insights", description: "Insights", icon: ChartNoAxesCombined },
  { label: "Add", href: "/add", description: "Add entry", icon: CirclePlus, primary: true },
  { label: "History", href: "/transactions", description: "History", icon: ArrowLeftRight },
  { label: "Settings", href: "/settings", description: "Settings", icon: Settings2 },
];
