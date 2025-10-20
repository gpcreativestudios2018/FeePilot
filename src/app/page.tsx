/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';

import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';

// NOTE: page.tsx lives in src/app/, while fees.ts lives in src/data/.
// So the correct relative import is ../data/fees (NOT ./data/fees).
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '../data/fees';

// ---------- helpers ----------
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Math.min(max, Math.max(min, n));
const asMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// ---------- UI state ----------
type Inputs = {
  price: number;
  shipping: number;
  discountPct: number;
  platform: PlatformKey;
};

export default function Page() {
  // defaults
  const [inputs, setInputs] = useState<Inputs>(() => ({
    price: 100,
    shipping: 0,
    discountPct: 0,
    platform: (PLATFORMS[0] ?? 'mercari') as PlatformKey,
  }));

  const rule: FeeRule | undefined = RULES[inputs.platform];

  // Derived calcs (kept simple to avoid type issues)
  const { discountedPrice, marketplaceFee, payout } = useMemo(() => {
    const price = clamp(Number(inputs.price) || 0, 0, 1_000_000);
    const ship = clamp(Number(inputs.shipping) || 0, 0, 1_000_000);
    const discountPct = clamp(Number(inputs.discountPct) || 0, 0, 100);

    const discounted = price * (1 - discountPct / 100);

    // Marketplace % fee only (avoid optional fields that weren’t in FeeRule)
    const pct = (rule?.marketplacePct ?? 0) / 100;
    const mkt = discounted * pct;

    // rudimentary payout: price - discount - fee - shipping (floor at 0)
    const payoutCalc = Math.max(0, discounted - mkt - ship);

    return {
      discountedPrice: discounted,
      marketplaceFee: mkt,
      payout: payoutCalc,
    };
  }, [inputs, rule]);

  // ---------- share / copy ----------
  const buildLink = (): string => {
    const url = new URL(window.location.href);
    const q = new URLSearchParams({
      price: String(inputs.price),
      shipping: String(inputs.shipping),
      discountPct: String(inputs.discountPct),
      platform: String(inputs.platform),
    });
    url.search = q.toString();
    return url.toString();
  };

  const copyLink = async (): Promise<string> => {
    const link = buildLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // ignore
    }
    return link;
  };

  const shareLink = async (): Promise<string> => {
    const link = buildLink();
    try {
      if (navigator.share) {
        await navigator.share({ url: link, title: 'FeePilot' });
      } else {
        await navigator.clipboard.writeText(link);
      }
    } catch {
      // ignore UX errors
    }
    return link;
  };

  // optional: hydrate from URL on load
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const next: Partial<Inputs> = {};
    if (p.get('price')) next.price = Number(p.get('price'));
    if (p.get('shipping')) next.shipping = Number(p.get('shipping'));
    if (p.get('discountPct')) next.discountPct = Number(p.get('discountPct'));
    if (p.get('platform') && PLATFORMS.includes(p.get('platform') as PlatformKey)) {
      next.platform = p.get('platform') as PlatformKey;
    }
    if (Object.keys(next).length) {
      setInputs((curr) => ({ ...curr, ...next }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">FeePilot</span>
        </div>

        <HeaderActions
          onShare={shareLink}
          onCopy={copyLink}
          proHref="https://github.com/gpcreativestudios2018"
        />
      </header>

      {/* Controls */}
      <section className="mb-4 rounded-2xl border border-purple-400/50 p-4">
        <div className="mb-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-xs text-neutral-500">Platform</span>
            <select
              className="rounded-md border border-neutral-300 bg-white px-2 py-1"
              value={inputs.platform}
              onChange={(e) =>
                setInputs((s) => ({
                  ...s,
                  platform: e.target.value as PlatformKey,
                }))
              }
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="text-xs text-neutral-500">
            Rules last updated:{' '}
            <span className="font-mono">
              {RULES_UPDATED_AT ?? ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col">
            <span className="text-xs text-neutral-500">Item price</span>
            <input
              type="number"
              className="rounded-md border border-neutral-300 px-2 py-1"
              value={inputs.price}
              onChange={(e) =>
                setInputs((s) => ({ ...s, price: Number(e.target.value) }))
              }
            />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-neutral-500">Buyer shipping</span>
            <input
              type="number"
              className="rounded-md border border-neutral-300 px-2 py-1"
              value={inputs.shipping}
              onChange={(e) =>
                setInputs((s) => ({ ...s, shipping: Number(e.target.value) }))
              }
            />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-neutral-500">Discount %</span>
            <input
              type="number"
              className="rounded-md border border-neutral-300 px-2 py-1"
              value={inputs.discountPct}
              onChange={(e) =>
                setInputs((s) => ({
                  ...s,
                  discountPct: Number(e.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      {/* Summary */}
      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-purple-400/70 p-4">
          <div className="text-xs text-neutral-500">Discounted price</div>
          <div className="text-lg font-semibold">{asMoney(discountedPrice)}</div>
        </div>

        <div className="rounded-2xl border border-purple-400/70 p-4">
          <div className="text-xs text-neutral-500">Marketplace fee</div>
          <div className="text-lg font-semibold">{asMoney(marketplaceFee)}</div>
        </div>

        <div className="rounded-2xl border border-purple-400/70 p-4">
          <div className="text-xs text-neutral-500">Estimated payout</div>
          <div className="text-lg font-semibold">{asMoney(payout)}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
