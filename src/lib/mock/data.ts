import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { WALLET_DEFINITIONS } from "@/constants/wallets";
import type {
  Budget,
  BudgetPlan,
  Category,
  Goal,
  RecurringPayment,
  Transaction,
  TransactionType,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
} from "@/types";

/**
 * Deterministic sample data for visual development only.
 * This module is NEVER written to IndexedDB — switching to "My data" starts
 * with an empty local journal, and importing samples is always explicit.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let random = mulberry32(20261125);
const rupees = (amount: number) => Math.round(amount * 100);
const pad = (value: number) => String(value).padStart(2, "0");
const iso = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

const FOOD = [
  "Coffee at Third Wave",
  "Lunch at the canteen",
  "Groceries at DMart",
  "Evening dosa with friends",
  "Maggi and eggs",
  "Weekend biryani",
  "Smoothie bowl",
];
const TRANSPORT = [
  "Metro card recharge",
  "Uber to campus",
  "Auto to the library",
  "Bus pass",
  "Fuel for the scooter",
];
const SHOPPING = [
  "Notebook and pens",
  "Sneakers",
  "Desk lamp",
  "Winter jacket",
  "Phone case",
];
const BILLS = ["Electricity bill", "Wi-Fi plan", "Mobile recharge", "Hostel fees"];
const ENTERTAINMENT = ["Netflix subscription", "Movie ticket", "Concert ticket", "Spotify plan"];
const HEALTH = ["Gym membership", "Pharmacy", "Dentist visit"];
const EDUCATION = ["Design systems book", "Online course", "Printing and binding"];
const PERSONAL_CARE = ["Barber", "Skincare", "Laundry", "Pharmacy essentials"];

const pick = (items: string[]) => items[Math.floor(random() * items.length)];
const jitter = (base: number, spread: number) => base + random() * spread;

let nextId = 1;

function entry(
  type: TransactionType,
  amount: number,
  categoryId: string,
  title: string,
  date: string,
  description?: string,
  paymentMethod?: string,
): Transaction {
  const stamp = `${date}T09:00:00.000Z`;
  const methods: Record<string, string> = {
    bills: "Bank Transfer",
    shopping: "Debit Card",
    entertainment: "Credit Card",
    education: "Bank Transfer",
    salary: "Bank Transfer",
    freelance: "UPI",
    allowance: "UPI",
    scholarship: "Bank Transfer",
    business: "Bank Transfer",
    gift: "Cash",
    "other-expense": "Cash",
  };
  const essentials = new Set(["bills", "groceries", "health", "education", "food", "travel"]);

  return {
    id: nextId++,
    type,
    amount: rupees(amount),
    categoryId,
    title,
    description,
    date,
    paymentMethod: paymentMethod ?? methods[categoryId] ?? "UPI",
    classification: type === "expense" ? (essentials.has(categoryId) ? "need" : "want") : undefined,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function buildTransactions(): Transaction[] {
  nextId = 1;
  const transactions: Transaction[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayISODate = today.getDate();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const cursor = new Date(currentYear, currentMonth - 1 - offset, 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = offset === 0 ? todayISODate : daysInMonth;
    const available = (day: number) => day <= lastDay;

    if (available(1)) {
      transactions.push(
        entry("income", 82000, "salary", "Monthly salary", iso(year, month, 1), "Design internship"),
      );
    }
    if (available(12)) {
      transactions.push(entry("income", 6000, "allowance", "Monthly allowance", iso(year, month, 12)));
    }
    if (offset !== 2 && available(21)) {
      transactions.push(
        entry("income", Math.round(jitter(9500, 4200)), "freelance", "Freelance project", iso(year, month, 21)),
      );
    }

    if (available(2)) {
      transactions.push(entry("expense", 18000, "bills", "Rent — sharing", iso(year, month, 2)));
    }
    if (available(3)) {
      transactions.push(entry("expense", 1200, "health", pick(HEALTH), iso(year, month, 3)));
    }
    if (available(6)) {
      transactions.push(entry("expense", 649, "entertainment", "Netflix subscription", iso(year, month, 6)));
    }
    if (available(8)) {
      transactions.push(entry("expense", Math.round(jitter(1350, 400)), "bills", pick(BILLS), iso(year, month, 8)));
    }
    if (available(10)) {
      transactions.push(entry("expense", 699, "bills", "Wi-Fi plan", iso(year, month, 10)));
    }
    if (available(11)) {
      transactions.push(entry("expense", 399, "bills", "Mobile recharge", iso(year, month, 11)));
    }
    if (available(16)) {
      transactions.push(
        entry("expense", Math.round(jitter(1800, 2600)), "shopping", pick(SHOPPING), iso(year, month, 16)),
      );
    }
    if (available(19)) {
      transactions.push(
        entry("expense", Math.round(jitter(450, 300)), "entertainment", pick(ENTERTAINMENT), iso(year, month, 19)),
      );
    }

    const groceryDays = [5, 14, 23];
    for (const day of groceryDays) {
      if (available(day)) {
        transactions.push(
          entry("expense", Math.round(jitter(1150, 1300)), "groceries", pick(FOOD), iso(year, month, day), "Weekly shop"),
        );
      }
    }

    const smallDays = [4, 7, 9, 13, 17, 20, 24, 26];
    for (const day of smallDays) {
      if (!available(day)) continue;
      const transportDay = day % 3 === 0;
      transactions.push(
        transportDay
          ? entry("expense", Math.round(jitter(80, 240)), "travel", pick(TRANSPORT), iso(year, month, day))
          : entry("expense", Math.round(jitter(140, 420)), "food", pick(FOOD), iso(year, month, day)),
      );
    }

    if (offset % 2 === 0 && available(9)) {
      transactions.push(entry("expense", Math.round(jitter(750, 500)), "education", pick(EDUCATION), iso(year, month, 9)));
    }
    if (available(15)) {
      transactions.push(entry("expense", Math.round(jitter(350, 450)), "personal-care", pick(PERSONAL_CARE), iso(year, month, 15)));
    }
    if (offset % 3 === 0 && available(18)) {
      transactions.push(entry("income", 5000, "scholarship", "Semester scholarship", iso(year, month, 18)));
    }
  }

  return transactions.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id ?? 0) - (a.id ?? 0),
  );
}

function buildBudgets(): Budget[] {
  const now = new Date();
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const stamp = new Date().toISOString();
  const limits: Array<[string, number]> = [
    ["food", 7000],
    ["travel", 2500],
    ["shopping", 4500],
    ["bills", 24000],
    ["entertainment", 2200],
    ["health", 1800],
    ["education", 2500],
  ];

  return limits.map(([categoryId, amount]) => ({
    id: nextId++,
    categoryId,
    month,
    amount: rupees(amount),
    createdAt: stamp,
    updatedAt: stamp,
  }));
}

function buildGoals(): Goal[] {
  const stamp = new Date().toISOString();
  const make = (
    name: string,
    targetAmount: number,
    savedAmount: number,
    icon: string,
    tint: Goal["tint"],
    deadlineOffsetDays: number,
  ): Goal => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineOffsetDays);
    const goalId = nextId++;
    const total = rupees(savedAmount);
    const first = Math.round(total * 0.6);
    const earlier = new Date();
    earlier.setDate(earlier.getDate() - 45);
    const contributions =
      total > 0
        ? [
            {
              id: `c-${goalId}-1`,
              amount: first,
              date: iso(earlier.getFullYear(), earlier.getMonth() + 1, earlier.getDate()),
              note: "First contribution",
              createdAt: stamp,
            },
            {
              id: `c-${goalId}-2`,
              amount: total - first,
              date: iso(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
              note: "Recent contribution",
              createdAt: stamp,
            },
          ]
        : [];
    return {
      id: goalId,
      name,
      targetAmount: rupees(targetAmount),
      savedAmount: total,
      deadline: iso(deadline.getFullYear(), deadline.getMonth() + 1, deadline.getDate()),
      icon,
      tint,
      contributions,
      createdAt: stamp,
      updatedAt: stamp,
    };
  };

  return [
    make("Emergency fund", 150000, 68000, "ShieldCheck", "lime", 240),
    make("New laptop", 85000, 34000, "Laptop", "blue", 150),
    make("Trip to Kyoto", 200000, 24500, "Sparkles", "violet", 365),
  ];
}

function buildBudgetPlan(): BudgetPlan {
  const now = new Date();
  return {
    month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    enabled: true,
    totalAvailable: rupees(60000),
    spendingAllowance: rupees(44500),
    protectedSavings: rupees(15500),
    thresholds: [80, 90, 100],
    recurringExpenses: [
      { id: "r1", label: "Wi-Fi plan", amount: rupees(699), dayOfMonth: 10, categoryId: "bills" },
      { id: "r2", label: "Netflix", amount: rupees(649), dayOfMonth: 6, categoryId: "entertainment" },
      { id: "r3", label: "Monthly top-up", amount: rupees(800), dayOfMonth: 28, categoryId: "groceries" },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function dueIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function buildRecurringPayments(): RecurringPayment[] {
  const stamp = new Date().toISOString();
  return [
    {
      id: nextId++,
      name: "Rent",
      amount: rupees(18000),
      categoryId: "bills",
      frequency: "monthly",
      nextDueDate: dueIn(6),
      reminderDays: 3,
      autoRecord: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: nextId++,
      name: "Wi-Fi plan",
      amount: rupees(699),
      categoryId: "bills",
      frequency: "monthly",
      nextDueDate: dueIn(13),
      reminderDays: 2,
      autoRecord: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: nextId++,
      name: "Gym membership",
      amount: rupees(1200),
      categoryId: "health",
      frequency: "monthly",
      nextDueDate: dueIn(21),
      reminderDays: 5,
      autoRecord: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

function buildWallets(): Wallet[] {
  const now = new Date();
  const stamp = now.toISOString();
  const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return WALLET_DEFINITIONS.map((definition, index) => ({
    id: definition.id,
    name: definition.name,
    kind: definition.kind,
    icon: definition.icon,
    paymentMethod: definition.paymentMethod,
    enabled: definition.id === "upi" || definition.id === "cash",
    sortOrder: index,
    openingBalance:
      definition.id === "upi"
        ? rupees(3500)
        : definition.id === "cash"
          ? rupees(1500)
          : 0,
    startDate,
    createdAt: stamp,
    updatedAt: stamp,
  }));
}

export interface MockData {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  budgetPlan: BudgetPlan;
  recurringPayments: RecurringPayment[];
  wallets: Wallet[];
  walletTransfers: WalletTransfer[];
  walletAdjustments: WalletAdjustment[];
}

export function createMockData(): MockData {
  // Reset the RNG on every call so SSR and CSR produce identical sample data
  // regardless of how many times this module is imported or invoked.
  random = mulberry32(20261125);
  return {
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: buildTransactions(),
    budgets: buildBudgets(),
    goals: buildGoals(),
    budgetPlan: buildBudgetPlan(),
    recurringPayments: buildRecurringPayments(),
    wallets: buildWallets(),
    walletTransfers: [],
    walletAdjustments: [],
  };
}
