/* eslint-disable @typescript-eslint/no-explicit-any */
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

function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function fmtMoney(n: number) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

function ProfitLabel({ value }: { value: number }) {
  if (value < 0) {
    // red + parentheses
    return <span className="text-rose-400">({fmtMoney(Math.abs(value))})</span>;
  }
  return <span className="text-emerald-400">{fmtMoney(value)}</span>;
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

/* -------- URL + localStorage (short keys) -------- */

type Inputs = {
  pr: number; // item price
  sc: number; // shipping charged to buyer
  ss: number; // your shipping cost
  cg: number; // COGS
  dc: number; // discount %
  tx: number; // tax %
};

const DEFAULTS: Inputs = {
  pr: 200,
  sc: 0,
  ss: 10,
  cg: 12,
  dc: 0,
  tx: 0,
};

const LS_KEY = 'feepilot:lastInputs';
const Q = {
  platform: 'p',
  price: 'pr',
  shipCharged: 'sc',
  shipCost: 'ss',
  cogs: 'cg',
  discount: 'dc',
  tax: 'tx',
} as const;

function readNumber(sp: URLSearchParams, key: string, fallback: number) {
  const v = sp.get(key);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ---------------- fee engine ---------------- */

/** Safely read optional numeric property that may not exist on FeeRule's TS type. */
function readOptionalNumber(rule: FeeRule, key: string): number {
  const anyRule = rule as any;
  const v = anyRule?.[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeForPlatform(rule: FeeRule, inputs: Inputs) {
  const price = clamp(inputs.pr, 0);
  const shipCharged = clamp(inputs.sc, 0);
  const shipCost = clamp(inputs.ss, 0);
  const cogs = clamp(inputs.cg, 0);
  const discountPct = clamp(inputs.dc, 0, 95);
  const taxPct = clamp(inputs.tx, 0, 25);

  const discountedPrice = price * (1 - discountPct / 100);
  const taxAmount = discountedPrice * (taxPct / 100);

  // Optional fixed pieces guarded via readOptionalNumber()
  const marketplaceFixed = readOptionalNumber(rule, 'marketplaceFixed');
  const paymentFixed = readOptionalNumber(rule, 'paymentFixed');
  const listingFee = readOptionalNumber(rule, 'listingFee');

  // marketplace fee is % of (item price + shipping charged + tax) + optional fixed
  const marketplaceBase = discountedPrice + shipCharged + taxAmount;
  const marketplaceFee =
    (marketplaceBase * (rule.marketplacePct ?? 0)) / 100 + marketplaceFixed;

  // payment fee is % of discounted item price + optional fixed
  const paymentFee =
    (discountedPrice * (rule.paymentPct ?? 0)) / 100 + paymentFixed;

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const profit =
    discountedPrice + shipCharged - totalFees - shipCost - cogs;

  const revenueBase = discountedPrice + shipCharged;
  const margin = revenueBase > 0 ? (profit / revenueBase) * 100 : 0;

  return {
    profit,
    margin,
    totalFees,
    marketplaceFee,
    paymentFee,
    listingFee,
  };
}

/* ---------------- page ---------------- */

export default function Page() {
  const [platform, setPlatform] = useState<PlatformKey>('mercari');
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [copiedAt, setCopiedAt] = useState<number>(0);

  // hydrate from URL or LS once
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = (sp.get(Q.platform) as PlatformKey) || 'mercari';

    const merged: Inputs = {
      pr: readNumber(sp, Q.price, DEFAULTS.pr),
      sc: readNumber(sp, Q.shipCharged, DEFAULTS.sc),
      ss: readNumber(sp, Q.shipCost, DEFAULTS.ss),
      cg: readNumber(sp, Q.cogs, DEFAULTS.cg),
      dc: readNumber(sp, Q.discount, DEFAULTS.dc),
      tx: readNumber(sp, Q.tax, DEFAULTS.tx),
    };

    // fall back to LS if no URL found
    const lsRaw = localStorage.getItem(LS_KEY);
    if (![Q.price, Q.shipCharged, Q.shipCost, Q.cogs, Q.discount, Q.tax].some(k => sp.has(k)) && lsRaw) {
      try {
        const ls = JSON.parse(lsRaw) as Inputs;
        Object.assign(merged, ls);
      } catch {}
    }

    setPlatform(PLATFORMS.includes(p) ? p : 'mercari');
    setInputs(merged);
  }, []);

  // write URL + LS whenever inputs / platform change
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set(Q.platform, platform);
    sp.set(Q.price, String(inputs.pr));
    sp.set(Q.shipCharged, String(inputs.sc));
    sp.set(Q.shipCost, String(inputs.ss));
    sp.set(Q.cogs, String(inputs.cg));
    sp.set(Q.discount, String(inputs.dc));
    sp.set(Q.tax, String(inputs.tx));

    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', url);
    localStorage.setItem(LS_KEY, JSON.stringify(inputs));
  }, [platform, inputs]);

  const rule = RULES[platform];
  const overview = useMemo(() => computeForPlatform(rule, inputs), [rule, inputs]);

  function setNum<K extends keyof Inputs>(key: K) {
    return (v: string) => {
      const n = Number(v);
      setInputs(s => ({ ...s, [key]: Number.isFinite(n) ? n : (s[key] as number) }));
    };
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedAt(Date.now());
      setTimeout(() => setCopiedAt(0), 1200);
    });
  }

  function shareLink() {
    const url = window.location.href;
    if ((navigator as any).share) {
      (navigator as any).share({ url, title: 'FeePilot' }).catch(() => {});
    } else {
      copyLink();
    }
  }

  function resetAll() {
    setPlatform('mercari');
    setInputs(DEFAULTS);
    localStorage.removeItem(LS_KEY);
  }

  // comparison rows for all platforms
  const compareRows = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = RULES[p];
      const c = computeForPlatform(r, inputs);
      return { p, ...c };
    });
  }, [inputs]);

  const borderGlow = 'rounded-3xl border border-violet-600/60 shadow-[0_0_0_2px_rgba(139,92,246,0.35)] bg-neutral-950/60';

  return (
    <main className="min-h-screen bg-black text-neutral-200">
      {/* top border accent */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500/80 via-fuchsia-500/80 to-violet-500/80" />

      {/* header */}
      <header className="mx-auto max-w-6xl px-4 pt-6 pb-4 flex items-center justify-between">
        <button onClick={resetAll} className="group flex items-center gap-3">
          <span className="h-3 w-3 rounded-sm bg-violet-500 group-hover:bg-violet-400 transition-colors" />
          <span className="text-xl font-semibold tracking-tight">FeePilot</span>
        </button>
        <HeaderActions onShare={shareLink} onCopy={copyLink} />
      </header>

      {/* tiny copied toast */}
      {copiedAt !== 0 && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-neutral-900/95 px-3 py-2 text-sm text-neutral-100 border border-violet-600/50">
          copied!
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pb-16 space-y-8">
        {/* platform + overview */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* platform card */}
          <div className={borderGlow}>
            <div className="p-6">
              <div className="text-neutral-400 text-sm mb-2">Platform</div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformKey)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-violet-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              <div className="mt-2 text-sm text-neutral-400">
                Rules last updated:{' '}
                <span className="font-mono">{RULES_UPDATED_AT ?? ''}</span>
              </div>
            </div>
          </div>

          {/* overview card */}
          <div className={borderGlow}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-neutral-400 text-sm">Overview</div>
                <div className="text-neutral-400 text-sm">Margin</div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="text-4xl font-semibold">
                  <ProfitLabel value={overview.profit} />
                </div>
                <div className="text-3xl font-semibold">
                  {overview.margin < 0 ? (
                    <span className="text-rose-400">{pct(overview.margin)}</span>
                  ) : (
                    <span className="text-emerald-400">{pct(overview.margin)}</span>
                  )}
                </div>
              </div>

              {/* fees breakdown */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                  <div className="text-neutral-400 text-sm">Marketplace fee</div>
                  <div className="mt-1 font-medium">{fmtMoney(overview.marketplaceFee)}</div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                  <div className="text-neutral-400 text-sm">Payment fee</div>
                  <div className="mt-1 font-medium">{fmtMoney(overview.paymentFee)}</div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                  <div className="text-neutral-400 text-sm">Listing fee</div>
                  <div className="mt-1 font-medium">{fmtMoney(overview.listingFee)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* inputs */}
        <section className={borderGlow}>
          <div className="p-6">
            <div className="text-neutral-400 text-sm mb-4">Inputs</div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Item price"
                value={String(inputs.pr)}
                onChange={setNum('pr')}
              />
              <Field
                label="Shipping charged"
                value={String(inputs.sc)}
                onChange={setNum('sc')}
              />
              <Field
                label="Shipping cost (your cost)"
                value={String(inputs.ss)}
                onChange={setNum('ss')}
              />
              <Field label="COGS" value={String(inputs.cg)} onChange={setNum('cg')} />
              <Field
                label="Discount (%)"
                value={String(inputs.dc)}
                onChange={setNum('dc')}
                inputMode="decimal"
              />
              <Field
                label="Tax (%)"
                value={String(inputs.tx)}
                onChange={setNum('tx')}
                inputMode="decimal"
              />
            </div>
          </div>
        </section>

        {/* compare table */}
        <section className={borderGlow}>
          <div className="p-6 overflow-x-auto">
            <div className="text-neutral-400 text-sm mb-4">
              Comparing with current inputs (
              <span className="font-semibold">${inputs.pr.toFixed(2)}</span> price,{' '}
              <span className="font-semibold">${inputs.sc.toFixed(2)}</span> ship charge,{' '}
              <span className="font-semibold">${inputs.ss.toFixed(2)}</span> ship cost,{' '}
              <span className="font-semibold">${inputs.cg.toFixed(2)}</span> COGS,{' '}
              <span className="font-semibold">{inputs.dc}%</span> discount,{' '}
              <span className="font-semibold">{inputs.tx}%</span> tax).
            </div>

            <table className="min-w-full text-sm">
              <thead className="text-neutral-400">
                <tr className="border-b border-neutral-800/80">
                  <th className="px-3 py-2 text-left">Platform</th>
                  <th className="px-3 py-2 text-left">Profit</th>
                  <th className="px-3 py-2 text-left">Margin</th>
                  <th className="px-3 py-2 text-left">Marketplace fee</th>
                  <th className="px-3 py-2 text-left">Payment fee</th>
                  <th className="px-3 py-2 text-left">Listing fee</th>
                  <th className="px-3 py-2 text-left">Total fees</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.p} className="border-b border-neutral-900/60">
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-md bg-neutral-900/70 px-3 py-1 text-neutral-200">
                        {row.p[0].toUpperCase() + row.p.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-left">
                      <ProfitLabel value={row.profit} />
                    </td>
                    <td className="px-3 py-3">
                      {row.margin < 0 ? (
                        <span className="text-rose-400">{pct(row.margin)}</span>
                      ) : (
                        <span className="text-emerald-400">{pct(row.margin)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{fmtMoney(row.marketplaceFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.paymentFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.listingFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.totalFees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}

/* ------------- small input component ------------- */

function Field({
  label,
  value,
  onChange,
  inputMode = 'numeric',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-neutral-400 text-sm">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-violet-500"
        inputMode={inputMode}
      />
    </label>
  );
}
