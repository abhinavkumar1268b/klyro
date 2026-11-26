export const WARNING_THRESHOLDS = [80, 90, 100] as const;
export const DEFAULT_WARNING_THRESHOLDS = [...WARNING_THRESHOLDS];

/** Planned allocations only — these values never represent moved money. */
export const DEFAULT_TOTAL_AVAILABLE = 10_000;
export const DEFAULT_SPENDING_ALLOWANCE = 7_000;
export const DEFAULT_PROTECTED_SAVINGS = 3_000;
