'use client';

import React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';
import {
  PLATFORMS,
  RULES,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

// --- small helpers (mirrors your main page math) ---
const pct = (n: number) => n / 100;
const clamp = (n: number, min = 0, max = 1_000_000) => Math.min(max, Math.max(min, n));
const parseNum = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getListingFixed = (rule: FeeRule): number => {
  const anyRule = rule as unknown as { listingFixed?: number };
  return anyRule.listingFixed ?? 0;
};

// Given a price P and inputs, compute profit & margin with platform rule
function computeAtPrice(rule: FeeRule, price: number, shipCost: number, cogs: number) {
  const discounted = clamp(price, 0); // no discount fields (v1)
  const shipCharge = 0;               // buyer pays 0 (v1)
  const base = discounted + shipCharge;

  const marketplaceFee =
    clamp(base * pct(rule.marketplacePct ?? 0)) + (rule.marketplaceFixed ?? 0);
  const paymentFee =
    clamp(base * pct(rule.paymentPct ?? 0)) + (rule.paymentFixed ?? 0);
  const listingFee = getListingFixed(rule);

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const profit =
    discounted + shipCharge -
    totalFees -
    shipCost -
    cogs;

  const marginPct = discounted > 0 ? (profit / discounted) * 100 : 0;

  return { discounted, marketplaceFee, paymentFee, listingFee, totalFees, profit, marginPct };
}

// Binary-search a price to hit a target profit OR margin
function solvePrice(opts: {
  rule: FeeRule;
  targetProfit?: number;   // dollars
  targetMarginPct?: number; // %
  shipCost: number;
  cogs: number;
}) {
  const { rule, targetProfit, targetMarginPct, shipCost, cogs } = opts;

  // prefer profit if both provided; else margin if provided; else null
  const mode: 'profit' | 'margin' | null =
    Number.isFinite(targetProfit as number) && (targetProfit as number) > 0
      ? 'profit'
      : Number.isFinite(targetMarginPct as number) && (targetMarginPct as number) > 0
      ? 'margin'
      : null;

  if (!mode) return { price: 0, result: computeAtPrice(rule, 0, shipCost, cogs) };

  let lo = 0;
  let hi = 1_000_000;
  // Quick expand hi if needed (rare)
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice(rule, mid, shipCost, cogs);
    const val = mode === 'profit' ? r.profit : r.marginPct;
    if (val < (mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number))) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  // Refine
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice(rule, mid, shipCost, cogs);
    const val = mode === 'profit' ? r.profit : r.marginPct;
    if (val < (mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number))) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const price = Math.max(0, hi);
  return { price, result: computeAtPrice(rule, price, shipCost, cogs) };
}

export default function ReverseCalcPage() {
  const [platform, setPlatform] = React.useState<PlatformKey>(PLATFORMS[0] ?? ('mercari' as PlatformKey));
  const [targetProfit, setTargetProfit] = React.useState<string>('25');
  const [targetMarginPct, setTargetMarginPct] = React.useState<string>('0'); // leave 0 to ignore
  const [cogs, setCogs] = React.useState<string>('12');
  const [shipCost, setShipCost] = React.useState<string>('5');

  const rule = RULES[platform];

  const solved = React.useMemo(() => {
    const tProfit = parseNum(targetProfit);
    const tMargin = parseNum(targetMarginPct);
    return solvePrice({
      rule,
      targetProfit: tProfit > 0 ? tProfit : undefined,
      targetMarginPct: tMargin > 0 ? tMargin : undefined,
      shipCost: clamp(parseNum(shipCost), 0),
      cogs: clamp(parseNum(cogs), 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, targetProfit, targetMarginPct, cogs, shipCost]);

  const { price, result } = solved;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reverse calculator</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Enter a target profit <i>or</i> margin — we’ll suggest a listing price (v1 assumes no discount and buyer pays $0 shipping).
        </p>
      </header>

      <section className="rounded-2xl border border-purple-600/40 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Platform</span>
            <select
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="text-black dark:text-white bg-white dark:bg-black">
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target profit ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 25"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              Set this OR margin; profit is used if both are set.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target margin (%)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">COGS ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={cogs}
              onChange={(e) => setCogs(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Your shipping cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={shipCost}
              onChange={(e) => setShipCost(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <Link href={"/pro" as Route} className={PILL_CLASS}>
            Back to Pro
          </Link>
        </div>
      </section>

      {/* Results */}
      <section className="mt-6 rounded-2xl border border-purple-600/30 p-6">
        <div className="text-base font-semibold">Suggested price</div>
        <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
          ${formatMoney(price)}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Estimated profit</div>
            <div className="mt-2 text-xl font-semibold" suppressHydrationWarning>
              ${formatMoney(result.profit)}
            </div>
          </div>

          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Estimated margin</div>
            <div className="mt-2 text-xl font-semibold" suppressHydrationWarning>
              {result.marginPct.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Marketplace fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.marketplaceFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.paymentFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Listing fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.listingFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total fees</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.totalFees)}</div>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          v1 assumptions: no discount, buyer pays $0 shipping. Next: add discount & buyer shipping.
        </p>
      </section>
    </main>
  );
}
