'use client';

import React from 'react';
import { PILL_CLASS } from '@/lib/ui';

type Props = {
  targetProfit?: number | null;
  targetMargin?: number | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractTargetsFrom(obj: unknown): { profit: number | null; margin: number | null } {
  if (!isRecord(obj)) return { profit: null, margin: null };

  // direct properties
  const profitDirect = parseNumber(obj['targetProfit']);
  const marginDirect = parseNumber(obj['targetMargin']);
  if (profitDirect !== null || marginDirect !== null) {
    return { profit: profitDirect, margin: marginDirect };
  }

  // common nestings
  const nests: unknown[] = [obj['state'], obj['inputs'], obj['data'], obj['form']];
  for (const n of nests) {
    if (!isRecord(n)) continue;
    const p = parseNumber(n['targetProfit']);
    const m = parseNumber(n['targetMargin']);
    if (p !== null || m !== null) return { profit: p, margin: m };
  }

  return { profit: null, margin: null };
}

/**
 * Shows a small pill like: "Solving for: Profit" or "Solving for: Margin"
 * - If props provided, they win.
 * - Otherwise, scans localStorage for persisted inputs and infers which goal is set.
 * - Profit takes precedence if both are present (> 0).
 */
export default function SolvingForPill({ targetProfit, targetMargin }: Props) {
  const [autoProfit, setAutoProfit] = React.useState<number | null>(null);
  const [autoMargin, setAutoMargin] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (targetProfit != null || targetMargin != null) return; // props win

    try {
      for (let i = 0; i < (typeof localStorage === 'undefined' ? 0 : localStorage.length); i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const raw = localStorage.getItem(key);
        if (!raw) continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue; // not JSON
        }

        const { profit, margin } = extractTargetsFrom(parsed);
        if (profit !== null || margin !== null) {
          setAutoProfit(profit);
          setAutoMargin(margin);
          break;
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [targetProfit, targetMargin]);

  const useProfit = (() => {
    const v = targetProfit ?? autoProfit;
    return typeof v === 'number' && !Number.isNaN(v) && v > 0;
  })();

  const useMargin = (() => {
    const v = targetMargin ?? autoMargin;
    return typeof v === 'number' && !Number.isNaN(v) && v > 0;
  })();

  const label = useProfit ? 'Profit' : useMargin ? 'Margin' : null;
  if (!label) return null;

  return (
    <span className={PILL_CLASS} aria-live="polite" suppressHydrationWarning>
      Solving for: {label}
    </span>
  );
}
