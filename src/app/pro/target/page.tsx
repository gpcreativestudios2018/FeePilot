'use client';

import React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PILL_CLASS } from '@/lib/ui';
import {
  PLATFORMS,
  RULES,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';
import SolvingForPill from './SolvingForPill';

// --- helpers (mirror main calculator math) ---
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
function computeAtPrice(opts: {
  rule: FeeRule;
  price: number;
  discountPct: number;
  shipCharge: number; // what buyer pays
  shipCost: number;   // your cost
  cogs: number;
}) {
  const { rule, price, discountPct, shipCharge, shipCost, cogs } = opts;

  const discounted = clamp(price * (1 - pct(discountPct)), 0);
  // Many platforms fee on (discounted price + buyer shipping)
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
  targetProfit?: number;     // dollars
  targetMarginPct?: number;  // %
  discountPct: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
}) {
  const { rule, targetProfit, targetMarginPct, discountPct, shipCharge, shipCost, cogs } = opts;

  // prefer profit if both provided; else margin if provided; else null
  const mode: 'profit' | 'margin' | null =
    Number.isFinite(targetProfit as number) && (targetProfit as number) > 0
      ? 'profit'
      : Number.isFinite(targetMarginPct as number) && (targetMarginPct as number) > 0
      ? 'margin'
      : null;

  if (!mode) {
    const result = computeAtPrice({ rule, price: 0, discountPct, shipCharge, shipCost, cogs });
    return { price: 0, result };
  }

  let lo = 0;
  let hi = 1_000_000;

  // Coarse then fine search
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice({ rule, price: mid, discountPct, shipCharge, shipCost, cogs });
    const val = mode === 'profit' ? r.profit : r.marginPct;
    const tgt = mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number);
    if (val < tgt) lo = mid; else hi = mid;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice({ rule, price: mid, discountPct, shipCharge, shipCost, cogs });
    const val = mode === 'profit' ? r.profit : r.marginPct;
    const tgt = mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number);
    if (val < tgt) lo = mid; else hi = mid;
  }

  const price = Math.max(0, hi);
  const result = computeAtPrice({ rule, price, discountPct, shipCharge, shipCost, cogs });
  return { price, result };
}

/**
 * Small helper component that reads query params in a Suspense boundary,
 * then calls back once to initialize state in the parent page.
 */
function QueryParamsInitializer(props: {
  onInit: (vals: {
    platform?: PlatformKey;
    targetProfit?: string;
    targetMarginPct?: string;
    cogs?: string;
    shipCost?: string;
    discountPct?: string;
    shipCharge?: string;
  }) => void;
}) {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const vals: {
      platform?: PlatformKey;
      targetProfit?: string;
      targetMarginPct?: string;
      cogs?: string;
      shipCost?: string;
      discountPct?: string;
      shipCharge?: string;
    } = {};

    const p = searchParams.get('platform');
    if (p && PLATFORMS.includes(p as PlatformKey)) vals.platform = p as PlatformKey;

    const tp = searchParams.get('targetProfit');
    if (tp !== null && tp !== undefined) vals.targetProfit = tp;

    const tm = searchParams.get('targetMarginPct');
    if (tm !== null && tm !== undefined) vals.targetMarginPct = tm;

    const cg = searchParams.get('cogs');
    if (cg !== null && cg !== undefined) vals.cogs = cg;

    const sc = searchParams.get('shipCost');
    if (sc !== null && sc !== undefined) vals.shipCost = sc;

    const dc = searchParams.get('discountPct');
    if (dc !== null && dc !== undefined) vals.discountPct = dc;

    const sb = searchParams.get('shipCharge');
    if (sb !== null && sb !== undefined) vals.shipCharge = sb;

    props.onInit(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function ReverseCalcPage() {
  const [platform, setPlatform] = React.useState<PlatformKey>(PLATFORMS[0] ?? ('mercari' as PlatformKey));

  // targets
  const [targetProfit, setTargetProfit] = React.useState<string>('25');
  const [targetMarginPct, setTargetMarginPct] = React.useState<string>('0'); // leave 0 to ignore

  // costs
  const [cogs, setCogs] = React.useState<string>('12');
  const [shipCost, setShipCost] = React.useState<string>('5');

  // price components that affect fees
  const [discountPct, setDiscountPct] = React.useState<string>('0');
  const [shipCharge, setShipCharge] = React.useState<string>('0'); // what buyer pays

  // feedback
  const [copied, setCopied] = React.useState(false);

  // One-time init from query params (via Suspense-safe child)
  const handleInitFromQuery = React.useCallback((vals: {
    platform?: PlatformKey;
    targetProfit?: string;
    targetMarginPct?: string;
    cogs?: string;
    shipCost?: string;
    discountPct?: string;
    shipCharge?: string;
  }) => {
    if (vals.platform) setPlatform(vals.platform);
    if (vals.targetProfit !== undefined) setTargetProfit(vals.targetProfit);
    if (vals.targetMarginPct !== undefined) setTargetMarginPct(vals.targetMarginPct);
    if (vals.cogs !== undefined) setCogs(vals.cogs);
    if (vals.shipCost !== undefined) setShipCost(vals.shipCost);
    if (vals.discountPct !== undefined) setDiscountPct(vals.discountPct);
    if (vals.shipCharge !== undefined) setShipCharge(vals.shipCharge);
  }, []);

  const rule = RULES[platform];

  const solved = React.useMemo(() => {
    const tProfit = parseNum(targetProfit);
    const tMargin = parseNum(targetMarginPct);
    return solvePrice({
      rule,
      targetProfit: tProfit > 0 ? tProfit : undefined,
      targetMarginPct: tMargin > 0 ? tMargin : undefined,
      discountPct: clamp(parseNum(discountPct), 0, 100),
      shipCharge: clamp(parseNum(shipCharge), 0),
      shipCost: clamp(parseNum(shipCost), 0),
      cogs: clamp(parseNum(cogs), 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, targetProfit, targetMarginPct, discountPct, shipCharge, cogs, shipCost]);

  const { price, result } = solved;

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.pathname = '/pro/target';
      const ordered = new URL(url.origin + url.pathname);
      ([
        ['platform', platform],
        ['targetProfit', targetProfit],
        ['targetMarginPct', targetMarginPct],
        ['cogs', cogs],
        ['shipCost', shipCost],
        ['discountPct', discountPct],
        ['shipCharge', shipCharge],
      ] as const).forEach(([k, v]) => ordered.searchParams.set(k, v));

      await navigator.clipboard.writeText(ordered.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert('Unable to copy link');
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Suspense boundary for useSearchParams() usage */}
      <React.Suspense fallback={null}>
        <QueryParamsInitializer onInit={handleInitFromQuery} />
      </React.Suspense>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reverse calculator</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Set a target profit <i>or</i> margin — we’ll suggest the listing price.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <SolvingForPill />
          {copied ? (
            <span className={PILL_CLASS} aria-live="polite" suppressHydrationWarning>
              Permalink copied!
            </span>
          ) : (
            <button
              type="button"
              onClick={handleCopyLink}
              className={PILL_CLASS}
            >
              Copy share link
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-purple-600/40 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Platform */}
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

          {/* Target profit */}
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

          {/* Target margin */}
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

          {/* COGS */}
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

          {/* Your shipping cost */}
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

          {/* Discount (%) */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Discount (%)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </label>

          {/* Shipping charged to buyer ($) */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Shipping charged to buyer ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 8"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={shipCharge}
              onChange={(e) => setShipCharge(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <Link href={'/pro' as Route} className={PILL_CLASS}>
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
          Now considers discount and buyer-paid shipping (both affect fee base).
        </p>
      </section>
    </main>
  );
}
