// src/app/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PLATFORMS, RULES, PlatformKey, calcFees } from '@/data/fees';

/* ----------------------- small helpers ----------------------- */

type Num = number | string;
const toNum = (v: Num) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n: number, lo = -1e12, hi = 1e12) => Math.min(hi, Math.max(lo, n));

/** Currency with parentheses for negatives */
function formatCurrency(n: number) {
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `($${abs})` : `$${abs}`;
}

/** Stable platform order => index mapping for compact URLs */
const PLATFORM_ORDER = PLATFORMS.map((p) => p.key as PlatformKey);
const keyToIndex = (k: PlatformKey) => Math.max(0, PLATFORM_ORDER.indexOf(k));
const indexToKey = (i: number): PlatformKey => PLATFORM_ORDER[i] ?? PLATFORM_ORDER[0];

/** Defaults */
const DEFAULTS = {
  platform: 'etsy' as PlatformKey,
  price: 120,
  shipCharge: 0,
  shipCost: 10,
  cogs: 40,
  tax: 0,
  disc: 0,
  target: 50,
};

/** Read initial state from URL once (supports compact ?v=... and legacy keys) */
function readInitialFromUrl() {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);

  // New compact format: v=<idx>.<pr>.<sc>.<ss>.<cg>.<tx>.<dc>.<tp>
  const v = q.get('v');
  if (v) {
    const parts = v.split('.').map((s) => (s.trim() === '' ? NaN : Number(s)));
    const [idx, pr, sc, ss, cg, tx, dc, tp] = parts as number[];
    return {
      platform: indexToKey(Number.isFinite(idx) ? idx : 0),
      price: Number.isFinite(pr) ? pr : DEFAULTS.price,
      shipCharge: Number.isFinite(sc) ? sc : DEFAULTS.shipCharge,
      shipCost: Number.isFinite(ss) ? ss : DEFAULTS.shipCost,
      cogs: Number.isFinite(cg) ? cg : DEFAULTS.cogs,
      tax: Number.isFinite(tx) ? tx : DEFAULTS.tax,
      disc: Number.isFinite(dc) ? dc : DEFAULTS.disc,
      target: Number.isFinite(tp) ? tp : DEFAULTS.target,
    };
  }

  // Legacy format fallback: keeps old links working
  const platform = (q.get('p') as PlatformKey) || DEFAULTS.platform;
  const price = parseFloat(q.get('pr') || '') || DEFAULTS.price;
  const shipCharge = parseFloat(q.get('sc') || '') || DEFAULTS.shipCharge;
  const shipCost = parseFloat(q.get('ss') || '') || DEFAULTS.shipCost;
  const cogs = parseFloat(q.get('cg') || '') || DEFAULTS.cogs;
  const tax = parseFloat(q.get('tx') || '') || DEFAULTS.tax;
  const disc = parseFloat(q.get('dc') || '') || DEFAULTS.disc;
  const target = parseFloat(q.get('tp') || '') || DEFAULTS.target;

  return {
    platform: (PLATFORMS.find((p) => p.key === platform)?.key ?? DEFAULTS.platform) as PlatformKey,
    price,
    shipCharge,
    shipCost,
    cogs,
    tax,
    disc,
    target,
  };
}

/** Write compact state to URL (debounced by caller) */
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
  const arr = [
    keyToIndex(s.platform),
    clamp(s.price),
    clamp(s.shipCharge),
    clamp(s.shipCost),
    clamp(s.cogs),
    clamp(s.tax),
    clamp(s.disc),
    clamp(s.target),
  ];
  const q = new URLSearchParams();
  q.set('v', arr.join('.'));
  const url = `${window.location.pathname}?${q.toString()}`;
  window.history.replaceState(null, '', url);
}

/* --------------------------- page --------------------------- */

export default function Page() {
  const initial = readInitialFromUrl();

  const [platform, setPlatform] = useState<PlatformKey>(initial?.platform ?? DEFAULTS.platform);
  const [price, setPrice] = useState<number>(initial?.price ?? DEFAULTS.price);
  const [shippingCharge, setShippingCharge] = useState<number>(initial?.shipCharge ?? DEFAULTS.shipCharge);
  const [shippingCost, setShippingCost] = useState<number>(initial?.shipCost ?? DEFAULTS.shipCost);
  const [cogs, setCogs] = useState<number>(initial?.cogs ?? DEFAULTS.cogs);
  const [taxCollected, setTaxCollected] = useState<number>(initial?.tax ?? DEFAULTS.tax);
  const [discountPct, setDiscountPct] = useState<number>(initial?.disc ?? DEFAULTS.disc);
  const [targetProfit, setTargetProfit] = useState<number>(initial?.target ?? DEFAULTS.target);

  // view toggle
  const [view, setView] = useState<'calc' | 'compare'>('calc');

  // Debounce URL updates
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
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [platform, price, shippingCharge, shippingCost, cogs, taxCollected, discountPct, targetProfit]);

  const calc = useMemo(() => {
    const r = RULES[platform];

    const discount = toNum(price) * (toNum(discountPct) / 100);
    const subtotal = toNum(price) - discount + toNum(taxCollected) + toNum(shippingCharge);
    const priceOnly = toNum(price) - discount; // for rules that want price-only base

    const parts = calcFees(r, { subtotal, priceOnly });

    const netProceeds = subtotal - parts.totalFees - toNum(shippingCost) - toNum(cogs);
    const profit = netProceeds;
    const margin = subtotal > 0 ? profit / subtotal : 0;

    // Backsolve for required price to hit targetProfit
    const findRequired = () => {
      // simple numeric solve since fees are tiered/nonlinear
      // binary search between $0 and $50k
      let lo = 0, hi = 50000;
      for (let i = 0; i < 36; i++) {
        const mid = (lo + hi) / 2;

        const discMid = mid * (toNum(discountPct) / 100);
        const subtotalMid = mid - discMid + toNum(taxCollected) + toNum(shippingCharge);
        const priceOnlyMid = mid - discMid;

        const fMid = calcFees(r, { subtotal: subtotalMid, priceOnly: priceOnlyMid });
        const profitMid = subtotalMid - fMid.totalFees - toNum(shippingCost) - toNum(cogs);

        if (profitMid < toNum(targetProfit)) lo = mid; else hi = mid;
      }
      return hi;
    };

    const requiredPrice = Number.isFinite(targetProfit) ? findRequired() : NaN;

    return {
      subtotal,
      ...parts,
      netProceeds,
      profit,
      margin,
      requiredPrice: Number.isFinite(requiredPrice) ? requiredPrice : NaN,
    };
  }, [platform, price, shippingCharge, shippingCost, cogs, taxCollected, discountPct, targetProfit]);

  // Compare view: compute results across all platforms with current inputs
  const compareRows = useMemo(() => {
    const discount = toNum(price) * (toNum(discountPct) / 100);
    const subtotal = toNum(price) - discount + toNum(taxCollected) + toNum(shippingCharge);
    const priceOnly = toNum(price) - discount;

    return PLATFORMS.map(({ key, label }) => {
      const r = RULES[key as PlatformKey];
      const parts = calcFees(r, { subtotal, priceOnly });
      const netProceeds = subtotal - parts.totalFees - toNum(shippingCost) - toNum(cogs);
      const profit = netProceeds;
      const margin = subtotal > 0 ? profit / subtotal : 0;
      return {
        key: key as PlatformKey,
        label,
        profit,
        margin,
        totalFees: parts.totalFees,
        marketplaceFee: parts.marketplaceFee,
        paymentFee: parts.paymentFee,
        listingFee: parts.listingFee,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [price, discountPct, taxCollected, shippingCharge, shippingCost, cogs]);

  const copySummary = async () => {
    const lines = [
      `FeePilot Summary`,
      `Platform: ${PLATFORMS.find(p => p.key === platform)?.label ?? platform}`,
      `Price: ${formatCurrency(price)} | Discount: ${discountPct}%`,
      `Ship charge: ${formatCurrency(shippingCharge)} | Ship cost: ${formatCurrency(shippingCost)}`,
      `COGS: ${formatCurrency(cogs)} | Tax: ${formatCurrency(taxCollected)}`,
      `—`,
      `Subtotal: ${formatCurrency(calc.subtotal)}`,
      `Marketplace fee: ${formatCurrency(calc.marketplaceFee)}`,
      `Payment fee: ${formatCurrency(calc.paymentFee)}${calc.listingFee ? ` | Listing fee: ${formatCurrency(calc.listingFee)}` : ''}`,
      `Total fees: ${formatCurrency(calc.totalFees)}`,
      `Net proceeds: ${formatCurrency(calc.netProceeds)}`,
      `Profit: ${formatCurrency(calc.profit)} | Margin: ${(calc.margin * 100).toFixed(1)}%`,
      `Required price for target (${formatCurrency(targetProfit)}): ${Number.isFinite(calc.requiredPrice) ? formatCurrency(calc.requiredPrice) : '—'}`,
      `Link: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      alert('Summary copied!');
    } catch {
      alert('Copy failed—select and copy manually.');
    }
  };

  const resetAll = () => {
    setPlatform(DEFAULTS.platform);
    setPrice(DEFAULTS.price);
    setShippingCharge(DEFAULTS.shipCharge);
    setShippingCost(DEFAULTS.shipCost);
    setCogs(DEFAULTS.cogs);
    setTaxCollected(DEFAULTS.tax);
    setDiscountPct(DEFAULTS.disc);
    setTargetProfit(DEFAULTS.target);
  };

  const profitIsNeg = calc.profit < 0;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* purple badge */}
            <div className="h-4 w-4 rounded bg-purple-500 shadow-[0_0_20px_3px_rgba(168,85,247,0.45)]" />
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

            <button
              onClick={copySummary}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
              title="Copy a summary of inputs/results"
            >
              Copy Summary
            </button>

            <button
              onClick={resetAll}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
              title="Reset all fields to defaults"
            >
              Reset
            </button>

            <a
              href="https://vercel.com"
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
            >
              Pro
            </a>
          </div>
        </div>

        {/* View toggle */}
        <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-neutral-800">
          <button
            onClick={() => setView('calc')}
            className={
              'px-4 py-2 text-sm ' +
              (view === 'calc' ? 'bg-purple-600/30 text-white' : 'bg-neutral-900/50 text-neutral-300 hover:bg-neutral-900')
            }
          >
            Calculator
          </button>
          <button
            onClick={() => setView('compare')}
            className={
              'px-4 py-2 text-sm ' +
              (view === 'compare' ? 'bg-purple-600/30 text-white' : 'bg-neutral-900/50 text-neutral-300 hover:bg-neutral-900')
            }
          >
            Compare
          </button>
        </div>

        {view === 'calc' ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Inputs */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                <label className="mb-2 block text-sm text-neutral-400">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformKey)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
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
                      {Number.isFinite(calc.requiredPrice) ? formatCurrency(calc.requiredPrice) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Output */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-900/40 bg-neutral-900/50 p-5 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.18)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Overview</p>
                    <p
                      className={
                        'mt-2 text-3xl font-semibold ' +
                        (profitIsNeg ? 'text-rose-400' : 'text-emerald-400')
                      }
                    >
                      {formatCurrency(calc.profit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-400">Margin</p>
                    <p
                      className={
                        'mt-2 text-2xl font-semibold ' +
                        (calc.margin < 0 ? 'text-rose-400' : 'text-neutral-200')
                      }
                    >
                      {(calc.margin * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={profitIsNeg ? 'h-full bg-rose-500' : 'h-full bg-emerald-500'}
                    style={{ width: `${Math.max(0, Math.min(100, Math.abs(calc.margin) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">Breakdown</h3>
                <Line label="Subtotal (after discount + tax + ship to buyer)" value={calc.subtotal} />
                <Line label="Marketplace fee" value={calc.marketplaceFee} />
                <Line label="Payment fee" value={calc.paymentFee} />
                {calc.listingFee ? <Line label="Listing fee" value={calc.listingFee} /> : null}
                <Line label="Shipping cost (your cost)" value={toNum(shippingCost)} />
                <Line label="COGS" value={toNum(cogs)} />
                <Divider />
                <Line label="Total fees" value={calc.totalFees} bold />
                <Line label="Net proceeds (after fees & ship cost)" value={calc.netProceeds} bold />
              </div>
            </div>
          </div>
        ) : (
          /* Compare view */
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
            <div className="mb-4 text-sm text-neutral-400">
              Comparing with current inputs (
              <span className="text-neutral-200">{formatCurrency(price)}</span> price,{' '}
              <span className="text-neutral-200">{formatCurrency(shippingCharge)}</span> ship charge,{' '}
              <span className="text-neutral-200">{formatCurrency(shippingCost)}</span> ship cost,{' '}
              <span className="text-neutral-200">{formatCurrency(cogs)}</span> COGS,{' '}
              <span className="text-neutral-200">{discountPct}%</span> discount,{' '}
              <span className="text-neutral-200">{formatCurrency(taxCollected)}</span> tax).
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-800 text-neutral-400">
                  <tr>
                    <th className="py-2 pr-3">Platform</th>
                    <th className="py-2 px-3 text-right">Profit</th>
                    <th className="py-2 px-3 text-right">Margin</th>
                    <th className="py-2 px-3 text-right">Total fees</th>
                    <th className="py-2 px-3 text-right">Marketplace fee</th>
                    <th className="py-2 px-3 text-right">Payment fee</th>
                    <th className="py-2 px-3 text-right">Listing fee</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r) => (
                    <tr key={r.key} className="border-b border-neutral-900/60 hover:bg-neutral-900/30">
                      <td className="py-2 pr-3">
                        <button
                          className="rounded border border-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
                          onClick={() => { setPlatform(r.key); setView('calc'); }}
                          title="Switch calculator to this platform"
                        >
                          {r.label}
                        </button>
                      </td>
                      <td className={'py-2 px-3 text-right ' + (r.profit < 0 ? 'text-rose-400' : 'text-neutral-200')}>
                        {formatCurrency(r.profit)}
                      </td>
                      <td className="py-2 px-3 text-right">{(r.margin * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(r.totalFees)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(r.marketplaceFee)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(r.paymentFee)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(r.listingFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <footer className="mx-auto mt-10 max-w-6xl text-center text-sm text-neutral-500">
          Made by <span className="text-purple-400">FeePilot</span>. Sporty Neon theme.
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
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
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
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px w-full bg-neutral-800" />;
}
