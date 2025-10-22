'use client';

import React, { useMemo, useState } from 'react';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';
import ResetButton from './components/ResetButton';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

// helpers & components we added
import { cx, formatMoneyWithParens } from '../lib/format';
import ComparisonTableSection from './components/ComparisonTableSection';

/* ---------------------------------- types --------------------------------- */

type Inputs = {
  platform: PlatformKey;
  price: number;
  shipCharge: number; // what you charge the buyer for shipping
  shipCost: number;   // your actual shipping cost
  cogs: number;       // cost of goods sold
  discountPct: number;
  tax: number;        // tax collected (if any)
};

/* ------------------------------ handy utilities ---------------------------- */

// accept decimals; treat invalid/empty as 0
const parseNum = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Math.min(max, Math.max(min, n));

const pct = (n: number) => n / 100;

/** Safely read a possibly-missing fixed listing fee without tripping TS. */
const getListingFixed = (rule: FeeRule): number => {
  const anyRule = rule as unknown as { listingFixed?: number };
  return anyRule.listingFixed ?? 0;
};

/** Core calculator for one platform. */
function calcFor(
  rule: FeeRule,
  inputs: Inputs
): {
  discounted: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  totalFees: number;
  net: number;
  profit: number;
  marginPct: number;
} {
  const discounted = clamp(inputs.price * (1 - pct(inputs.discountPct)));
  const base = discounted + inputs.shipCharge;

  const marketplaceFee =
    clamp(base * pct(rule.marketplacePct ?? 0)) + (rule.marketplaceFixed ?? 0);

  const paymentFee =
    clamp(base * pct(rule.paymentPct ?? 0)) + (rule.paymentFixed ?? 0);

  const listingFee = getListingFixed(rule);

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const net =
    discounted +
    inputs.shipCharge -
    totalFees -
    inputs.shipCost -
    inputs.cogs -
    inputs.tax;

  const profit = net;
  const marginPct = discounted > 0 ? (profit / discounted) * 100 : 0;

  return {
    discounted,
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    net,
    profit,
    marginPct,
  };
}

/* ----------------------------- share/copy helpers -------------------------- */

const shareLink = async (): Promise<void> => {
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'FeePilot', url });
    } catch {
      // user canceled share — ignore
    }
  } else {
    await navigator.clipboard.writeText(url);
  }
};

const copyLink = async (): Promise<void> => {
  const url = window.location.href;
  await navigator.clipboard.writeText(url);
};

/* ---------------------------- defaults + component ------------------------- */

function makeDefaults(): Inputs {
  return {
    platform: PLATFORMS[0] ?? ('mercari' as PlatformKey),
    price: 100,
    shipCharge: 0,
    shipCost: 10,
    cogs: 40,
    discountPct: 0,
    tax: 0,
  };
}

/* ----------------------------------- UI ----------------------------------- */

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>(makeDefaults());
  const resetInputs = () => setInputs(makeDefaults());

  const rule = RULES[inputs.platform];

  const current = useMemo(() => calcFor(rule, inputs), [rule, inputs]);

  const comparison = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = RULES[p];
      const c = calcFor(r, inputs);
      return { platform: p, r, ...c };
    });
  }, [inputs]);

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-full bg-purple-500 ring-2 ring-purple-400/50"
            />
            FeePilot
          </h1>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
            <ResetButton onClick={resetInputs} />
            <HeaderActions onShare={shareLink} onCopy={copyLink} />
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full border border-purple-600/50 px-3 py-1 text-sm text-purple-200">
          Rules last updated: {RULES_UPDATED_AT}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* Inputs */}
        <section className="rounded-2xl border border-purple-600/40 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Platform</label>
              <select
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.platform}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    platform: e.target.value as PlatformKey,
                  }))
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-black text-white">
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Item price ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.price}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, price: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Discount (%)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.discountPct}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    discountPct: clamp(parseNum(e.target.value), 0, 100),
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Shipping charged to buyer ($)
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.shipCharge}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    shipCharge: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Your shipping cost ($)
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.shipCost}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, shipCost: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">COGS ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.cogs}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, cogs: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Tax collected ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                value={inputs.tax}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, tax: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Discounted price</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.discounted)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Marketplace fee</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.marketplaceFee)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Payment fee</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.paymentFee)}
            </div>
          </div>

          {/* Always show Listing fee card (even when $0.00) */}
          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Listing fee</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.listingFee)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Total fees</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.totalFees)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Estimated payout</div>
            <div className="mt-2 text-3xl font-semibold">
              {formatMoneyWithParens(current.net)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Profit</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold',
                current.profit < 0 ? 'text-red-500' : 'text-emerald-300'
              )}
            >
              {formatMoneyWithParens(current.profit)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Margin</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold',
                current.marginPct < 0 && 'text-red-500'
              )}
            >
              {current.marginPct.toFixed(1)}%
            </div>
          </div>
        </section>

        {/* Comparison table (now via component, with banner + negative formatting) */}
        <ComparisonTableSection
          className="mt-10"
          inputs={{
            price: inputs.price,
            shipCharge: inputs.shipCharge,
            shipCost: inputs.shipCost,
            cogs: inputs.cogs,
            discountPct: inputs.discountPct,
            tax: inputs.tax,
          }}
          comparison={comparison.map((row) => ({
            platform: row.platform,
            profit: row.profit,
            marginPct: row.marginPct,
            marketplaceFee: row.marketplaceFee,
            paymentFee: row.paymentFee,
            listingFee: row.listingFee,
            totalFees: row.totalFees,
          }))}
        />

        {/* Footer – wrap to apply margin since Footer doesn't accept props */}
        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}
