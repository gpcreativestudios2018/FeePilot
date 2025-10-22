// src/lib/format.ts
// Small helper functions for money/percent formatting and sign checks.
// These are PURE functions and safe to use anywhere in the app.

export function formatMoneyWithParens(value: number): string {
  const abs = Math.abs(value).toFixed(2);
  return value < 0 ? `($${abs})` : `$${Number(value).toFixed(2)}`;
}

export function formatPercent(value: number, digits = 1): string {
  // Displays like: -329.9% or 12.3%
  return `${value.toFixed(digits)}%`;
}

export function isNegative(value: number): boolean {
  return value < 0;
}

// (Optional) generic className helper we’ll use later for conditional styles
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
