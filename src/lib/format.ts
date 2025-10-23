// src/lib/format.ts

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Money like $12.34 or ($12.34) for negatives.
// Safe if value is undefined/null/NaN.
export function formatMoneyWithParens(value?: number, digits = 2): string {
  const n = Number.isFinite(value as number) ? (value as number) : 0;
  const abs = Math.abs(n).toFixed(digits);
  const s = `$${abs}`;
  return n < 0 ? `(${s})` : s;
}

// Percent like -329.9% or 12.3%
// Safe if value is undefined/null/NaN.
export function formatPercent(value?: number, digits = 1): string {
  const n = Number.isFinite(value as number) ? (value as number) : 0;
  return `${n.toFixed(digits)}%`;
}

// Negative guard (treats undefined as 0)
export function isNegative(value?: number): boolean {
  const n = Number.isFinite(value as number) ? (value as number) : 0;
  return n < 0;
}
