'use client';

import React, { useMemo, useState } from 'react';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

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

const parseNum = (v: string) => {
  const n = Number(v);
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
/*  NOTE: These return Promise<void> to satisfy HeaderActions props.           */

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

/* ----------------------------------- UI ----------------------------------- */

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>({
    platform: PLATFORMS[0] ?? ('mercari' as PlatformKey),
    price: 100,
    shipCharge: 0,
    shipCost: 10,
    cogs: 40,
    discountPct: 0,
    tax: 0,
  });

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
          <h1 className="text-3xl font-semibold tracking-tight">FeePilot</h1>
          <HeaderActions onShare={shareLink} onCopy={copyLink} />
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
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
                value={inputs.price}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, price: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Discount (%)</label>
              <input
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
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
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
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
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
                value={inputs.shipCost}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, shipCost: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">COGS ($)</label>
              <input
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
                value={inputs.cogs}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, cogs: clamp(parseNum(e.target.value), 0) }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Tax collected ($)</label>
              <input
                className="w-full rounded-xl border border-purple-600/50 bg-transparent px-3 py-2 outline-none"
                inputMode="decimal"
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
              ${current.discounted.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Marketplace fee</div>
            <div className="mt-2 text-3xl font-semibold">
              ${current.marketplaceFee.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Payment fee</div>
            <div className="mt-2 text-3xl font-semibold">
              ${current.paymentFee.toFixed(2)}
            </div>
          </div>

          {current.listingFee > 0 && (
            <div className="rounded-2xl border border-purple-600/40 p-5">
              <div className="text-sm text-gray-300">Listing fee</div>
              <div className="mt-2 text-3xl font-semibold">
                ${current.listingFee.toFixed(2)}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Total fees</div>
            <div className="mt-2 text-3xl font-semibold">
              ${current.totalFees.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Estimated payout</div>
            <div className="mt-2 text-3xl font-semibold">
              ${current.net.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Profit</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-300">
              ${current.profit.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-600/40 p-5">
            <div className="text-sm text-gray-300">Margin</div>
            <div className="mt-2 text-3xl font-semibold">
              {current.marginPct.toFixed(1)}%
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mt-10 rounded-2xl border border-purple-600/40 p-4 sm:p-6">
          <div className="mb-4 text-sm text-gray-300">
            Comparing with current inputs (${inputs.price.toFixed(2)} price, $
            {inputs.shipCharge.toFixed(2)} ship charge, $
            {inputs.shipCost.toFixed(2)} ship cost, ${inputs.cogs.toFixed(2)} COGS,{' '}
            {inputs.discountPct.toFixed(1)}% discount, ${inputs.tax.toFixed(2)} tax)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-300">
                <tr>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Profit</th>
                  <th className="py-2 pr-4">Margin</th>
                  <th className="py-2 pr-4">Marketplace fee</th>
                  <th className="py-2 pr-4">Payment fee</th>
                  <th className="py-2 pr-4">Listing fee</th>
                  <th className="py-2 pr-4">Total fees</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.platform} className="border-t border-white/10">
                    <td className="py-2 pr-4">
                      <span className="rounded-lg border border-white/10 px-2 py-1">
                        {row.platform[0].toUpperCase() + row.platform.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-emerald-300">
                      ${row.profit.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">{row.marginPct.toFixed(1)}%</td>
                    <td className="py-2 pr-4">${row.marketplaceFee.toFixed(2)}</td>
                    <td className="py-2 pr-4">${row.paymentFee.toFixed(2)}</td>
                    <td className="py-2 pr-4">${row.listingFee.toFixed(2)}</td>
                    <td className="py-2 pr-4">${row.totalFees.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer – wrap to apply margin since Footer doesn't accept props */}
        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}
