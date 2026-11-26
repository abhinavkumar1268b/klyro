# Android companion — architecture notes

KLYRO is a web application installed from a browser. A PWA home-screen shortcut is **not** a native Android home-screen widget, and this repository does not pretend otherwise.

## What exists today

- An installable PWA: web app manifest, 192/512 px icons, standalone display mode and a service worker that precaches the application shell.
- A local-first data layer: Dexie/IndexedDB is the source of truth for transactions, budgets, goals, categories, recurring payments and settings.
- A service layer (`src/features/*`) that owns all reads and writes. UI components never touch IndexedDB directly.
- Money calculations in pure utilities (`src/lib/calculations/*`), reusable by any future client.

## What a native companion would need

A future Kotlin application using Jetpack Glance can display glanceable balances or a "add expense" action. It should treat the browser's IndexedDB data as authoritative and synchronise through an explicit user-approved bridge — for example, an exported JSON backup via Android Storage Access Framework, or a local content provider exposed by a wrapped WebView app.

Do not duplicate financial formulas in Kotlin. Port or share the tested calculations from `src/lib/calculations` so the widget and the web app agree. Do not transmit financial data to an external service without explicit user consent.

No widget code is included in this repository.
