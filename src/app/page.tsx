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
  shipping: number;     // buyer shipping (informational)
  discountPct: number;
};

// ----- helpers -----
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;

const toMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// safe parse from localStorage
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

export default function Page() {
  const defaultPlatform =
    (PLATFORMS[0]?.key as PlatformKey | undefined) ?? ('mercari' as PlatformKey);

  const [inputs, setInputs] = useState<Inputs>(() =>
    parseInputs(
      typeof window === 'undefined' ? null : localStorage.getItem('feepilot:inputs'),
      { platform: defaultPlatform, price: 100, shipping: 0, discountPct: 0 }
    )
  );

  // tiny toast when share/copy happens
  const [copiedAt, setCopiedAt] = useState<number>(0);

  useEffect(() => {
    // persist settings
    try {
      localStorage.setItem('feepilot:inputs', JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const rule: FeeRule = RULES[inputs.platform];

  const discounted = useMemo(() => {
    const pct = clamp(inputs.discountPct, 0, 100);
    return clamp(inputs.price * (1 - pct / 100), 0);
  }, [inputs.price, inputs.discountPct]);

  // Marketplace fee and payment fee (if defined in the rule map)
  const marketplaceFee = useMemo(() => {
    const pct = (rule.marketplacePct ?? 0) / 100;
    return clamp(discounted * pct, 0);
  }, [discounted, rule.marketplacePct]);

  const paymentFee = useMemo(() => {
    const pct = (rule.paymentPct ?? 0) / 100;
    const fixed = rule.paymentFixed ?? 0;
    return clamp(discounted * pct + fixed, 0);
  }, [discounted, rule.paymentPct, rule.paymentFixed]);

  const totalFees = marketplaceFee + paymentFee;
  const payout = clamp(discounted - totalFees, 0);

  async function shareLink(): Promise<void> {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'FeePilot', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    setCopiedAt(Date.now());
  }

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedAt(Date.now());
  }

  function resetAll() {
    setInputs({ platform: defaultPlatform, price: 100, shipping: 0, discountPct: 0 });
    try {
      localStorage.removeItem('feepilot:inputs');
    } catch {}
  }

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16">
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
            className="ml-2 inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium ring-1 ring-white/10"
            title="Last time the fee rules were reviewed"
          >
            Rules last updated: {RULES_UPDATED_AT}
          </span>
        </div>

        <HeaderActions onShare={shareLink} onCopy={copyLink} />
      </header>

      {/* Input Card */}
      <section className="rounded-2xl border border-violet-500/40 bg-black/20 p-6 ring-1 ring-inset ring-violet-500/40">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Platform */}
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm text-neutral-400">
              Platform
              <span className="ml-1 text-neutral-500" title="Choose where you sell">
                (?)
              </span>
            </label>
            <select
              value={inputs.platform}
              onChange={(e) =>
                setInputs((s) => ({ ...s, platform: e.target.value as PlatformKey }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Item price
              <span className="ml-1 text-neutral-500" title="Before fees & discounts">
                (?)
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={inputs.price}
              onChange={(e) =>
                setInputs((s) => ({ ...s, price: clamp(Number(e.target.value), 0) }))
              }
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Discount %
              <span
                className="ml-1 text-neutral-500"
                title="Percentage off list price applied by you or the platform"
              >
                (?)
              </span>
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
              className="w-full rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-violet-500/50">
            <div className="text-sm text-neutral-400">Discounted price</div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(discounted)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-violet-500/50">
            <div className="text-sm text-neutral-400">
              Marketplace fee
              <span
                className="ml-1 text-neutral-500"
                title="Marketplace fee based on the rule set for this platform"
              >
                (?)
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(marketplaceFee)}</div>
          </div>

          <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-violet-500/50">
            <div className="text-sm text-neutral-400">Estimated payout</div>
            <div className="mt-2 text-2xl font-semibold">{toMoney(payout)}</div>
          </div>
        </div>
      </section>

      {/* tiny toast for copy/share */}
      {copiedAt > 0 && Date.now() - copiedAt < 1800 && (
        <div className="pointer-events-none fixed right-5 top-5 z-50 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur ring-1 ring-white/20">
          copied!
        </div>
      )}

      <Footer />
    </main>
  );
}
