'use client';

import React from 'react';
import { PILL_CLASS } from '@/lib/ui';

/**
 * Auto-detects whether the reverse calculator is currently solving for Profit or Margin.
 * Strategy:
 * - If props are passed, they win.
 * - Otherwise, scan localStorage for any JSON object that contains numeric
 *   `targetProfit` / `targetMargin` values (works with current persistence without knowing exact keys).
 * - Profit takes precedence if both are present and > 0.
 */
type Props = {
  targetProfit?: number | null;
  targetMargin?: number | null;
};

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function SolvingForPill({ targetProfit, targetMargin }: Props) {
  const [autoProfit, setAutoProfit] = React.useState<number | null>(null);
  const [autoMargin, setAutoMargin] = React.useState<number | null>(null);

  React.useEffect(() => {
    // If props were provided, don't auto-detect.
    if (targetProfit != null || targetMargin != null) return;

    try {
      // Scan all localStorage keys and try to find values.
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;

        const raw = localStorage.getItem(k);
        if (!raw) continue;

        // Try direct numeric (unlikely), JSON object, or nested object.
        let obj: any = null;
        try {
          obj = JSON.parse(raw);
        } catch {
          // not JSON; skip
          continue;
        }

        // Shallow check
        let p = parseNumber(obj?.targetProfit);
        let m = parseNumber(obj?.targetMargin);

        // If not found shallow, try common nesting like obj.state or obj.inputs
        if (p == null && m == null) {
          const candidates = [obj?.state, obj?.inputs, obj?.data, obj?.form];
          for (const c of candidates) {
            if (!c || typeof c !== 'object') continue;
            p = p ?? parseNumber(c.targetProfit);
            m = m ?? parseNumber(c.targetMargin);
          }
        }

        // If we found something, set and stop scanning.
        if (p != null || m != null) {
          setAutoProfit(p ?? null);
          setAutoMargin(m ?? null);
          break;
        }
      }
    } catch {
      // Ignore localStorage access errors (SSR or blocked storage).
    }
  }, [targetProfit, targetMargin]);

  const hasProfit = (() => {
    const v = targetProfit ?? autoProfit;
    return typeof v === 'number' && !Number.isNaN(v) && v > 0;
  })();

  const hasMargin = (() => {
    const v = targetMargin ?? autoMargin;
    return typeof v === 'number' && !Number.isNaN(v) && v > 0;
  })();

  const label = hasProfit ? 'Profit' : hasMargin ? 'Margin' : null;

  if (!label) return null;

  return (
    <span className={PILL_CLASS} aria-live="polite" suppressHydrationWarning>
      Solving for: {label}
    </span>
  );
}
