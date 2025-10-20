'use client';

import React, { useEffect, useMemo, useState } from 'react';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

type Inputs = {
  platform: PlatformKey;
  price: number;
  shipping: number;     // paid by buyer
  discountPct: number;  // % off list price
};

// ---------- helpers ----------
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;

const toMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

function parseInputs(raw: string | null, fallback: Inputs): Inputs {
  try {
    if (!raw) return fallback;
    const j = JSON.parse(raw);
    return {
      platform: (j.platform ?? fallback.platform) as PlatformKey,
      price: clamp(Number(j.price ?? fallback.price), 0),
      shipping: clamp(Number(j.shipping ?? fallback.shipping), 0),
      discountPct: clamp(Number(j.discountPct ?? fallback.discountPct), 0, 100),
    };
  } catch {
    return fallback;
  }
}

function computeFor(
  rule: FeeRule,
  price: number,
  discountPct: number
): {
  discounted: number;
  marketplaceFee: number;
  paymentFee: number;
  totalFees: number;
  payout: number;
  effectiveRatePct: number;
  marginPct: number;
} {
  const discounted = clamp(price * (1 - clamp(discountPct, 0, 100) / 100), 0);
  const marketplaceFee = clamp(discounted * ((rule.marketplacePct ?? 0) / 100) + (rule.marketplaceFixed ?? 0), 0);
  const paymentFee = clamp(discounted * ((rule.paymentPct ?? 0) / 100) + (rule.paymentFixed ?? 0), 0);
  const totalFees = marketplaceFee + paymentFee;
  const payout = clamp(discounted - totalFees, 0);
  const effectiveRatePct = discounted > 0 ? (totalFees / discounted) * 100 : 0;
  const marginPct = price > 0 ? (payout / price) * 100 : 0;
  return { discounted, marketplaceFee, paymentFee, totalFees, payout, effectiveRatePct, marginPct };
}

export default function Page() {
  const defaultPlatform =
    (PLATFORMS[0]?.key as PlatformKey | undefined) ?? ('mercari' as PlatformKey);

  const [inputs, setInputs] = useState<Inputs>(() =>
    parseInputs(
      typeof window === 'undefined' ? null : localStorage.getItem('feepilot:inputs'),
      { platform: defaultPlatform, price: 100, shipping: 0, discountPct: 0 }
    )
  );

  const [toastAt, setToastAt] = useState<number>(0);
  const [showCompare, setShowCompare] = useState<boolean>(false);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem('feepilot:inputs', JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const rule: FeeRule = RULES[inputs.platform];

  // core calcs for the chosen platform (shipping doesn't affect fees, only buyer pays it)
  const {
    discounted,
    marketplaceFee,
    paymentFee,
    totalFees,
    payout,
    effectiveRatePct,
    marginPct,
  } = useMemo(
    () => computeFor(rule, inputs.price, inputs.discountPct),
    [rule, inputs.price, inputs.discountPct]
  );

  async function shareLink(): Promise<void> {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'FeePilot', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    setToastAt(Date.now());
  }

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    setToastAt(Date.now());
  }

  function resetAll() {
    setInputs({ platform: defaultPlatform, price: 100, shipping: 0, discountPct: 0 });
    try {
      localStorage.removeItem('feepilot:inputs');
    } catch {}
  }

  const ringBox =
    'rounded-2xl bg-black/20 p-6 ring-2 ring-inset ring-violet-500/70 border border-violet-500/30';

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-transparent px-0 text-2xl font-extrabold tracking-tight"
            onClick={resetAll}
            title="Reset"
          >
            FeePilot
          </button>

          <span
            className="ml-2 inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium ring-2 ring-violet-500/60"
            title="Last time the fee rules were reviewed"
          >
            Rules last updated: {RULES_UPDATED_AT}
          </span>
        </div>

        <HeaderActions onShare={shareLink} onCopy={copyLink} />
      </header>

      {/* Inputs */}
      <section className={ringBox}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Platform */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Platform <span className="ml-1 text-neutral-500" title="Choose where you sell">(?)</span>
            </label>
            <select
              value={inputs.platform}
              onChange={(e) =>
                setInputs((s) => ({ ...s, platform: e.target.value as PlatformKey }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-2 ring-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Item price */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Item price <span className="ml-1 text-neutral-500" title="Before fees & discounts">(?)</span>
            </label>
            <input
              type="number"
              min={0}
              value={inputs.price}
              onChange={(e) =>
                setInputs((s) => ({ ...s, price: clamp(Number(e.target.value), 0) }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-2 ring-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Buyer shipping */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Buyer shipping <span className="ml-1 text-neutral-500" title="Shipping paid by buyer, not included in fees">(?)</span>
            </label>
            <input
              type="number"
              min={0}
              value={inputs.shipping}
              onChange={(e) =>
                setInputs((s) => ({ ...s, shipping: clamp(Number(e.target.value), 0) }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-2 ring-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Discount % */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Discount %{' '}
              <span className="ml-1 text-neutral-500" title="Percentage off list price">(?)</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={inputs.discountPct}
              onChange={(e) =>
                setInputs((s) => ({
                  ...s,
                  discountPct: clamp(Number(e.target.value), 0, 100),
                }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-2 ring-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">Discounted price</div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(discounted)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">
              Marketplace fee{' '}
              <span className="ml-1 text-neutral-500" title="Percent/fixed by platform">(?)</span>
            </div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(marketplaceFee)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">
              Payment fee <span className="ml-1 text-neutral-500" title="Processor fees">(?)</span>
            </div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(paymentFee)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">Total fees</div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(totalFees)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">Estimated payout</div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(payout)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-2 ring-violet-500/60">
            <div className="text-sm text-neutral-400">
              Margin / Eff. fee{' '}
              <span className="ml-1 text-neutral-500" title="Payout ÷ price, and fees ÷ discounted">(?)</span>
            </div>
            <div className="mt-2 text-xl font-semibold">
              {marginPct.toFixed(1)}%{' '}
              <span className="text-neutral-400"> / fee {effectiveRatePct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Compare toggle */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            className="rounded-xl px-3 py-2 text-sm font-medium ring-2 ring-violet-500/60 hover:ring-violet-400/80 hover:bg-white/5 transition"
          >
            {showCompare ? 'Hide' : 'Show'} Compare
          </button>
        </div>

        {/* Compare grid */}
        {showCompare && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {PLATFORMS.map((p) => {
              const r = RULES[p.key as PlatformKey];
              const c = computeFor(r, inputs.price, inputs.discountPct);
              return (
                <div
                  key={p.key}
                  className="rounded-2xl bg-black/30 p-4 ring-2 ring-violet-500/50"
                >
                  <div className="mb-1 text-sm text-neutral-400">{p.label}</div>
                  <div className="text-lg font-semibold">{toMoney(c.payout)}</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    fee {c.effectiveRatePct.toFixed(1)}% • margin {c.marginPct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Copied toast */}
      {toastAt > 0 && Date.now() - toastAt < 2200 && (
        <div className="pointer-events-none fixed right-6 top-6 z-50 rounded-lg bg-violet-600/90 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
          Copied!
        </div>
      )}

      <Footer />
    </main>
  );
}
