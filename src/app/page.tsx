'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PLATFORMS, RULES, PlatformKey } from '@/data/fees';

/* ----------------------- small helpers ----------------------- */

type Num = number | string;
const toNum = (v: Num) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

const clamp = (n: number, lo = -1e12, hi = 1e12) => Math.min(hi, Math.max(lo, n));

/** Read initial state from URL once (safe on client) */
function readInitialFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }
  const q = new URLSearchParams(window.location.search);

  const platform = (q.get('p') as PlatformKey) || 'etsy';
  const price = parseFloat(q.get('pr') || '') || 120;
  const shipCharge = parseFloat(q.get('sc') || '') || 0;
  const shipCost = parseFloat(q.get('ss') || '') || 10;
  const cogs = parseFloat(q.get('cg') || '') || 40;
  const tax = parseFloat(q.get('tx') || '') || 0;
  const disc = parseFloat(q.get('dc') || '') || 0;
  const target = parseFloat(q.get('tp') || '') || 50;

  return {
    platform: (PLATFORMS.find((p) => p.key === platform)?.key ?? 'etsy') as PlatformKey,
    price,
    shipCharge,
    shipCost,
    cogs,
    tax,
    disc,
    target,
  };
}

/** Write state to URL (debounced by caller) */
function writeToUrl(s: {
  platform: PlatformKey;
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  tax: number;
  disc: number;
  target: number;
}) {
  const q = new URLSearchParams();
  q.set('p', s.platform);
  q.set('pr', String(clamp(s.price)));
  q.set('sc', String(clamp(s.shipCharge)));
  q.set('ss', String(clamp(s.shipCost)));
  q.set('cg', String(clamp(s.cogs)));
  q.set('tx', String(clamp(s.tax)));
  q.set('dc', String(clamp(s.disc)));
  q.set('tp', String(clamp(s.target)));
  const url = `${window.location.pathname}?${q.toString()}`;
  window.history.replaceState(null, '', url);
}

/* --------------------------- page --------------------------- */

export default function Page() {
  // Initialize state from URL (once), with safe fallbacks.
  const initial = readInitialFromUrl();
  const [platform, setPlatform] = useState<PlatformKey>(initial?.platform ?? 'etsy');

  const [price, setPrice] = useState<number>(initial?.price ?? 120);
  const [shippingCharge, setShippingCharge] = useState<number>(initial?.shipCharge ?? 0);
  const [shippingCost, setShippingCost] = useState<number>(initial?.shipCost ?? 10);
  const [cogs, setCogs] = useState<number>(initial?.cogs ?? 40);
  const [taxCollected, setTaxCollected] = useState<number>(initial?.tax ?? 0);
  const [discountPct, setDiscountPct] = useState<number>(initial?.disc ?? 0);
  const [targetProfit, setTargetProfit] = useState<number>(initial?.target ?? 50);

  // Debounce URL updates to avoid spamming replaceState
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      writeToUrl({
        platform,
        price,
        shipCharge: shippingCharge,
        shipCost: shippingCost,
        cogs,
        tax: taxCollected,
        disc: discountPct,
        target: targetProfit,
      });
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [
    platform,
    price,
    shippingCharge,
    shippingCost,
    cogs,
    taxCollected,
    discountPct,
    targetProfit,
  ]);

  const calc = useMemo(() => {
    const r = RULES[platform];

    const discount = toNum(price) * (toNum(discountPct) / 100);
    const subtotal =
      toNum(price) - discount + toNum(taxCollected) + toNum(shippingCharge);

    const marketplaceFee = subtotal * r.marketplacePct;
    const paymentFee = subtotal * r.paymentPct + r.paymentFixed;
    const listingFee = r.listingFixed ?? 0;

    const totalFees = marketplaceFee + paymentFee + listingFee;
    const netProceeds = subtotal - totalFees - toNum(shippingCost) - toNum(cogs);
    const profit = netProceeds;
    const margin = subtotal > 0 ? profit / subtotal : 0;

    // Backsolve: required price for target profit
    const A = r.marketplacePct + r.paymentPct;
    const fixed = r.paymentFixed + (r.listingFixed ?? 0);
    const other = toNum(shippingCost) + toNum(cogs);
    const denomSubtotal = 1 - A;
    const requiredSubtotal =
      denomSubtotal > 0 ? (toNum(targetProfit) + fixed + other) / denomSubtotal : Infinity;

    const denomPrice = 1 - toNum(discountPct) / 100;
    const requiredPriceBeforeDiscount =
      requiredSubtotal - toNum(taxCollected) - toNum(shippingCharge);
    const requiredPrice =
      denomPrice > 0 ? requiredPriceBeforeDiscount / denomPrice : Infinity;

    return {
      subtotal,
      marketplaceFee,
      paymentFee,
      listingFee,
      totalFees,
      netProceeds,
      profit,
      margin,
      requiredPrice: Number.isFinite(requiredPrice) ? requiredPrice : NaN,
    };
  }, [
    platform,
    price,
    shippingCharge,
    shippingCost,
    cogs,
    taxCollected,
    discountPct,
    targetProfit,
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-emerald-500 shadow-[0_0_20px_3px_rgba(16,185,129,0.5)]" />
            <h1 className="text-xl font-semibold tracking-tight">FeePilot</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  alert('Link copied!');
                } catch {
                  alert('Copy failed—try manually copying the URL.');
                }
              }}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
              title="Copy current page link"
            >
              Share
            </button>

            <a
              href="https://vercel.com"
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
            >
              Pro
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <label className="mb-2 block text-sm text-neutral-400">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformKey)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-neutral-500">
                Rules last updated:{' '}
                <span className="text-neutral-300">{RULES[platform].lastUpdated}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Item price ($)" value={price} onChange={(v) => setPrice(toNum(v))} />
                <Field
                  label="Shipping charged to buyer ($)"
                  value={shippingCharge}
                  onChange={(v) => setShippingCharge(toNum(v))}
                />
                <Field
                  label="Your shipping cost ($)"
                  value={shippingCost}
                  onChange={(v) => setShippingCost(toNum(v))}
                />
                <Field label="Cost of goods ($)" value={cogs} onChange={(v) => setCogs(toNum(v))} />
                <Field
                  label="Tax collected ($)"
                  value={taxCollected}
                  onChange={(v) => setTaxCollected(toNum(v))}
                />
                <Field
                  label="Discount (%)"
                  value={discountPct}
                  onChange={(v) => setDiscountPct(toNum(v))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="mb-3 text-sm font-medium text-neutral-300">Backsolve</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Target profit ($)"
                  value={targetProfit}
                  onChange={(v) => setTargetProfit(toNum(v))}
                />
                <div className="flex flex-col">
                  <span className="mb-2 text-sm text-neutral-400">Required price:</span>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100">
                    {Number.isFinite(calc.requiredPrice) ? `$${calc.requiredPrice.toFixed(2)}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-900/40 bg-neutral-900/50 p-5 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Overview</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-400">
                    ${calc.profit.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-400">Margin</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-200">
                    {(calc.margin * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, calc.margin * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h3 className="mb-3 text-sm font-medium text-neutral-300">Breakdown</h3>
              <Line label="Subtotal (after discount + tax + ship to buyer)" value={calc.subtotal} />
              <Line label="Marketplace fee" value={calc.marketplaceFee} />
              <Line label="Payment fee" value={calc.paymentFee} />
              {RULES[platform].listingFixed ? (
                <Line label="Listing fee" value={calc.listingFee} />
              ) : null}
              <Line label="Shipping cost (your cost)" value={shippingCost} />
              <Line label="COGS" value={cogs} />
              <Divider />
              <Line label="Total fees" value={calc.totalFees} bold />
              <Line label="Net proceeds (after fees & ship cost)" value={calc.netProceeds} bold />
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-10 max-w-6xl text-center text-sm text-neutral-500">
          Made by <span className="text-emerald-400">FeePilot</span>. Sporty Neon theme.
        </footer>
      </div>
    </main>
  );
}

/* ---------------------- UI field helpers ---------------------- */

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Num;
  onChange: (v: Num) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        inputMode="decimal"
      />
    </label>
  );
}

function Line({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className={bold ? 'font-semibold text-neutral-100' : 'text-neutral-200'}>
        ${value.toFixed(2)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px w-full bg-neutral-800" />;
}
