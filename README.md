# KLYRO

**Your money. Your control.**

A premium, local-first personal finance companion for students and young earners. KLYRO is a private-by-design expense and savings journal: every record lives in the browser's IndexedDB, and there is no backend or account required.

KLYRO is a complete, local-first frontend: dashboard, insights, journal, budgets, goals, settings, onboarding and polished empty/loading/error states. Every navigation item and action is functional.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, CSS-first design tokens |
| UI | shadcn/ui-style primitives (Radix + CVA), Lucide icons |
| Charts | Recharts |
| Data | Dexie.js / IndexedDB, `dexie-react-hooks` for live queries |
| State | Zustand (UI + filter state only) |
| Forms | React Hook Form + Zod |
| Motion | Framer Motion |
| PWA | Web app manifest + offline service worker |
| Animation | Framer Motion (page transitions, drawers, dialogs) |

---

## Getting started

Requires Node.js 20.19+ (Node 24 recommended) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint (flat config)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests for financial calculations
```

Optional: regenerate PWA raster icons after changing the brand mark:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\generate-icons.ps1
```

---

## Architecture

```
src/
├── app/                     Routes, metadata, PWA manifest, global tokens
│   ├── globals.css          Design tokens + Tailwind theme
│   ├── layout.tsx           Root layout, fonts, metadata, providers, shell
│   ├── manifest.ts          PWA manifest (/manifest.webmanifest)
│   └── */page.tsx           Route scaffolds (overview, transactions, budget…)
├── components/
│   ├── layout/              App shell, sidebar, bottom nav, topbar, onboarding, dialogs
│   ├── dashboard/           Balance hero, stat cards, overview widgets
│   ├── transactions/        Add form, category picker, filterable history
│   ├── budget/              Budget form, progress rows, month navigator
│   ├── insights/            Cashflow, donut and cumulative trend charts
│   ├── goals/               Goal form, contributions, progress cards
│   ├── settings/            Profile, appearance, currency, data controls
│   └── ui/                  Reusable primitives (Button, Card, Dialog, Toast, …)
├── features/                Domain services — live writes go through Dexie
│   ├── transactions/        service + demo/live action dispatcher
│   ├── budget/              service + action dispatcher
│   ├── goals/               service + action dispatcher
│   └── categories/          category service
├── hooks/                   Generic and data hooks (live queries, media, debounce)
├── lib/
│   ├── db/                  Dexie schema, singleton, seed and sample import
│   ├── calculations/        Cashflow, budgets, goals, formatting
│   ├── validation/          Zod schemas shared by forms and services
│   ├── export/              CSV and JSON backup helpers
│   ├── mock/                Deterministic sample data (never auto-written)
│   └── pwa.ts               Service worker registration
├── stores/                  Zustand stores (UI, filters, settings, demo, toasts)
├── types/                   Domain interfaces
└── constants/               Navigation, seed categories, app identity
```

### Data flow

```
UI components → hooks → features/*-actions → (demo store | Dexie service)
                       ↑
              lib/calculations (pure functions)
```

- **Two explicit data modes.** `demo` uses a deterministic in-memory journal from `lib/mock`; `live` uses Dexie/IndexedDB. Sample records are never written to the real database unless the user explicitly clicks *Import samples* in Settings.
- **Dexie owns application data.** Zustand stores hold UI state, preferences, filters and the in-memory demo journal; they never mirror live database records.
- **Services own writes.** Components and hooks call `features/*` functions instead of touching Dexie directly. This keeps validation, unit conversion and timestamps in one place.
- **Live queries** via `dexie-react-hooks` re-render views automatically when IndexedDB changes.
- **Money is stored as integer minor units** (paise/cents). Never store floating-point currency amounts; use `toMinorUnits` / `fromMinorUnits` at the edges.

### Design system

All colour and shape decisions live in `src/app/globals.css` and are exposed through Tailwind's `@theme inline` block:

| Token | Value | Tailwind class |
| --- | --- | --- |
| Background | `#080B0E` | `bg-background` |
| Card | `#11161D` | `bg-card` |
| Elevated | `#1A222C` | `bg-elevated` |
| Primary | `#B9F36B` | `bg-primary`, `text-primary` |
| Foreground | `#E8EDF2` | `text-foreground` |
| Muted | `#8995A3` | `text-muted-foreground` |
| Danger | `#E87979` | `text-danger` |

Rules of thumb: matte surfaces, hairline borders, one accent, restrained motion, no gradients or full-colour dashboard cards. Use the shared `Card`, `Badge` and `Progress` primitives rather than re-inventing surfaces.

Ready-made foundation components live in each domain folder — for example `CashflowChart` (themed Recharts setup), `BudgetProgressRow`, `GoalProgressCard`, `TransactionTypeBadge` and `SettingsSection`. They are intentionally unused until their feature screens are built.

### Wallets and migration

Wallets are separate from budgets: they hold actual money (UPI and Cash by default), while budgets are spending limits. Wallet balances are derived as `opening balance + received - spent + transfers in - transfers out + manual adjustments`. Income credits and expenses debit only the wallet selected in the form; transfers move money between wallets and never appear in income/expense analytics.

Database v4 added `wallets`, `walletTransfers` and `walletAdjustments`. Existing transactions were not modified, duplicated or deleted. New wallets start with an opening balance of zero and a `startDate` of the upgrade day, so older transactions are never retroactively credited or debited. `initializeDatabase()` also seeds wallets if an upgraded database has an empty wallet table.

## Dates and midnight rollover

`src/lib/date.ts` is the single source for local calendar logic: local `YYYY-MM-DD` keys, local parsing, month keys, next-local-midnight calculation and date shifting. UTC timestamps are used only for `createdAt`/`updatedAt`; transaction `date` always represents the user's local calendar day. `src/lib/current-date.ts` schedules a timer to the next local midnight (recomputed each time, so 23/24/25-hour DST days are correct) and `useCurrentDate()` re-checks on visibility, focus, `pageshow`, online and resume events. The dashboard, insights and forms follow today's date until the user intentionally navigates away.

## Persistence and hydration

The Zustand UI store uses `persist` with `skipHydration: true`; `Providers` rehydrates it after mount so server-rendered markup always matches the first client render. First-run database seeding (`categories`, `currency`) is idempotent and runs once through `useDatabaseInit`.

### Screens and interactions

- **Onboarding** — three-step first-run flow (welcome, data mode, preferences), skippable and replayable from Settings.
- **Dashboard** — Available to Spend hero, three compact summary cards, budget progress, Safe to Spend Today with calculation tooltip, recent transactions with payment methods, and a savings goal mini-card. All values derive from the active data source (demo memory or IndexedDB).
- **Insights** — daily, weekly, monthly, yearly and custom filters. Monthly mode opens with a Sunday-first **Monthly Spending Calendar** showing each day's expenses with distribution-derived intensity tiers, date selection with income/expense/count and transaction detail, month navigation across years and a direct link to the selected day's history. Below it: daily spending bars, category analysis with previous-period comparisons, payment grouping, need-vs-want, weekly review, consistency streaks and data-derived insight statements. Comparisons are omitted when the prior period has no data.
- **Add entry** — amount-first income/expense form with icon categories, need/want classification, payment method, live preview, Zod validation and success feedback.
- **Transactions** — daily/monthly grouping, sorting, search plus category/payment-method/type/date filters, edit dialog, delete confirmation and CSV export. Writes go through Dexie; every record has an auto-increment id, ISO timestamps and a transaction date.
- **Budget** — monthly plan (total available, spending allowance, planned protected savings), allocation validation, configurable 80/90/100% warnings, no-budget tracking mode, per-category limits and recurring payment reminders (weekly/monthly/yearly, reminder lead time, explicit opt-in auto-recording). Savings allocations are explicitly planned, never represented as transferred money.
- **Goals** — mini savings goals with target amounts, target dates, progress, edit/delete, completion status and a separate contribution history. Contributions are stored on the goal only, never as expenses or income.
- **Settings** — grouped Profile (name, country, currency, week start, cents, default classification), Budget (plan, thresholds, mode, category limits), Categories (create/edit/delete/re-icon), Appearance (Dark/Light/System + accent), Notifications (in-app reminder preferences), Data management (CSV/JSON export, validated JSON restore, sample import, full reset) and Privacy (local-first explanation and deletion controls). Restores validate the file before a single database record is touched and run inside one IndexedDB transaction.
- **Mobile** — fixed bottom navigation (Home, Insights, Add, History, Settings) with the Add action emphasised; all cards stack and dialogs fit the viewport.

### PWA

`src/app/manifest.ts` serves `/manifest.webmanifest` (icons, standalone display, shortcuts). `public/sw.js` precaches every route document and its Next.js static chunks so all screens open offline after the first successful load. Navigation requests fall back to the cached document; `/_next/static` assets are cache-first; RSC and data requests are network-only, so no financial data ever enters a shared network cache. IndexedDB remains the sole source of truth, so adding, editing, deleting and analysing transactions work offline.

A PWA home-screen shortcut is **not** a native Android widget. See `docs/android-companion.md` for how a future Kotlin/Jetpack Glance companion can build on the same local-first architecture without duplicating formulas. `AGENTS.md` in the repository root is generated automatically by Next.js 16 and should be committed rather than deleted.
