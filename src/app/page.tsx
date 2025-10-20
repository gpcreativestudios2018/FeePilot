/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useMemo, useState } from 'react';

import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';

// ✅ Correct path (page.tsx is in src/app, data is in src/data)
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '../data/fees';

/* ---------------- helpers ---------------- */

const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);

const toPlatformKey = (v: string): PlatformKey =>
  (PLATFORMS.find((p) => p.key === v)?.key ?? 'mercari') as PlatformKey;

/* ---------------- share / copy ---------------- */

async function shareLink(): Promise<string> {
  const url =
    typeof window !== 'undefined' ? window.location.href : 'https://feepilot.app';

  try {
    if (typeof window !== 'undefined' && (navigator as any)?.share) {
      await (navigator as any).share({
        title: 'FeePilot',
        url,
        text: 'Estimate marketplace fees with FeePilot',
      });
    } else if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  } catch {
    // ignore user-cancel
  }
  return url;
}

async function copyLink(): Promise<string> {
  const url =
    typeof window !== 'undefined' ? window.location.href : 'https://feepilot.app';

  if (typeof window !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
  }
  return url;
}

/* ---------------- component ---------------- */

type Inputs = {
  price: number;
  shipping: number;
  tax: number;
  discountPct: number;
  tx: number; // payment processor txn fee %
  sc: number; // seller credit / promo %
};

export default function Page() {
  const [platform, setPlatform] = useState<PlatformKey>('mercari');
  const [inputs, setInputs] = useState<Inputs>({
    price: 100,
    shipping: 0,
    tax: 0,
    discountPct: 0,
    tx: 0,
    sc: 0,
  });

  // Persist last selections (optional nicety)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('feepilot:last');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.platform) setPlatform(toPlatformKey(String(parsed.platform)));
        if (parsed?.inputs) setInputs((s) => ({ ...s, ...parsed.inputs }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'feepilot:last',
        JSON.stringify({ platform, inputs }),
      );
    } catch {}
  }, [platform, inputs]);

  const rule: FeeRule = RULES[platform];

  // basic computation that is resilient to optional fields on FeeRule
  const breakdown = useMemo(() => {
    const price = clamp(inputs.price, 0);
    const shippingIn = clamp(inputs.shipping, 0);
    const tax = clamp(inputs.tax, 0);
    const discount = clamp(inputs.discountPct, 0);

    const discountedPrice = price * (1 - discount / 100);

    // Marketplace %
    const pct = (rule as any)?.marketplacePct ?? 0;

    // Optional fixed marketplace fee if present in data; safe-cast to any to avoid TS errors
    const fixed = (rule as any)?.marketplaceFixed ?? 0;

    const marketplaceBase =
      discountedPrice + clamp(inputs.sc, 0) + clamp(inputs.tx, 0);

    const marketplaceFee = (marketplaceBase * pct) / 100 + fixed;

    // Payment processor (simple example)
    const paymentPct = (rule as any)?.paymentPct ?? 0;
    const paymentFixed = (rule as any)?.paymentFixed ?? 0;
    const paymentFee = (discountedPrice * paymentPct) / 100 + paymentFixed;

    const shippingOut = (rule as any)?.shippingPassThru ? shippingIn : 0;

    const totalFees = marketplaceFee + paymentFee;
    const proceeds = discountedPrice + shippingIn - tax - totalFees - shippingOut;

    return {
      price,
      shippingIn,
      tax,
      discountedPrice,
      marketplaceFee,
      paymentFee,
      totalFees,
      proceeds,
    };
  }, [inputs, platform, rule]);

  const strongRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2';

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <button
            className={`rounded-xl px-2 py-1 text-left ${strongRing}`}
            onClick={() => {
              setInputs({
                price: 100,
                shipping: 0,
                tax: 0,
                discountPct: 0,
                tx: 0,
                sc: 0,
              });
              setPlatform('mercari');
            }}
            aria-label="Reset"
            title="Reset"
          >
            <span className="text-xl font-semibold tracking-tight">FeePilot</span>
          </button>

          {/* Share / Copy / Pro */}
          <HeaderActions
            onShare={shareLink}
            onCopy={copyLink}
            proHref="https://github.com/gpcreativestudios2018"
          />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Platform + updated date */}
        <section className="mb-6 rounded-2xl border border-neutral-800 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label
                htmlFor="platform"
                className="block text-sm text-neutral-400"
              >
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(toPlatformKey(e.target.value))}
                className={`mt-1 w-64 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm ${strongRing}`}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 text-sm text-neutral-400">
              Rules last updated:{' '}
              <span className="font-mono text-neutral-300">
                {RULES_UPDATED_AT ?? ''}
              </span>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Item price"
            value={inputs.price}
            onChange={(v) => setInputs((s) => ({ ...s, price: v }))}
            strongRing={strongRing}
          />
          <Field
            label="Shipping (buyer pays)"
            value={inputs.shipping}
            onChange={(v) => setInputs((s) => ({ ...s, shipping: v }))}
            strongRing={strongRing}
          />
          <Field
            label="Sales tax"
            value={inputs.tax}
            onChange={(v) => setInputs((s) => ({ ...s, tax: v }))}
            strongRing={strongRing}
          />
          <Field
            label="Discount %"
            value={inputs.discountPct}
            onChange={(v) => setInputs((s) => ({ ...s, discountPct: v }))}
            strongRing={strongRing}
          />
          <Field
            label="Txn % (processor)"
            value={inputs.tx}
            onChange={(v) => setInputs((s) => ({ ...s, tx: v }))}
            strongRing={strongRing}
          />
          <Field
            label="Seller credit %"
            value={inputs.sc}
            onChange={(v) => setInputs((s) => ({ ...s, sc: v }))}
            strongRing={strongRing}
          />
        </section>

        {/* Results */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card title="Marketplace fee">{fmt(breakdown.marketplaceFee)}</Card>
          <Card title="Payment fee">{fmt(breakdown.paymentFee)}</Card>
          <Card title="Total fees">{fmt(breakdown.totalFees)}</Card>
          <Card title="Estimated proceeds">{fmt(breakdown.proceeds)}</Card>
        </section>
      </div>

      <Footer />
    </main>
  );
}

/* ---------------- small components ---------------- */

function Field({
  label,
  value,
  onChange,
  strongRing,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  strongRing: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-400">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className={`w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 ${strongRing}`}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{children}</div>
    </div>
  );
}
