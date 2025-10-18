'use client';

import { useEffect, useMemo, useState } from 'react';
import Footer from './components/Footer';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  PlatformKey,
  FeeRule,
} from '@/data/fees';

/* ---------- helpers ---------- */
function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

function fmtMoney(n: number) {
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const s = abs.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  return isNeg ? `(${s})` : s;
}

function moneyClass(n: number) {
  return n < 0 ? 'text-red-400' : 'text-emerald-400';
}

/* =========================================
   NUMBER INPUT UX
   - Keep a string the user is typing (so "100" works)
   - Parse on every change for live math
   ========================================= */
type Inputs = {
  p: PlatformKey; // platform
  pr: number;     // price
  sc: number;     // ship charge to buyer
  ss: number;     // your ship cost
  cg: number;     // COGS
  tx: number;     // tax collected
  dc: number;     // discount %
  tp: number;     // target profit
};

const DEFAULTS: Inputs = {
  p: 'etsy',
  pr: 120,
  sc: 0,
  ss: 10,
  cg: 40,
  tx: 0,
  dc: 0,
  tp: 50,
};

// Abbreviated keys used in the URL
const URL_KEYS: (keyof Inputs)[] = ['p', 'pr', 'sc', 'ss', 'cg', 'tx', 'dc', 'tp'];

/* Parse URL params on first load */
function readFromURL(): Partial<Inputs> {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const out: Partial<Inputs> = {};
  const p = sp.get('p') as PlatformKey | null;
  if (p && PLATFORMS.some((x) => x.key === p)) out.p = p;

  function num(k: keyof Inputs) {
    const v = sp.get(k as string);
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  (['pr', 'sc', 'ss', 'cg', 'tx', 'dc', 'tp'] as const).forEach((k) => {
    const v = num(k);
    if (typeof v === 'number') (out as any)[k] = v;
  });

  return out;
}

/* Write URL params (no navigation) */
function writeToURL(inputs: Inputs) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams();
  URL_KEYS.forEach((k) => {
    sp.set(k, k === 'p' ? inputs[k] : String(inputs[k]));
  });
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', url);
}

/* ---------- fee math ---------- */
function computeForPlatform(rule: FeeRule, inputs: Inputs) {
  // discount is % off item price
  const discountPct = clamp(inputs.dc, 0, 100) / 100;
  const discountedPrice = clamp(inputs.pr) * (1 - discountPct);

  // marketplace fee: % of (item + shipping charged + tax) AFTER discount + optional fixed
  const marketplaceBase = discountedPrice + clamp(inputs.sc) + clamp(inputs.tx);
  const marketplaceFee =
    marketplaceBase * (rule.marketplacePct ?? 0) + (rule.marketplaceFixed ?? 0);

  // payment fee: % of discounted item price + optional fixed
  const paymentFee =
    discountedPrice * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0);

  // listing fee (usually fixed)
  const listingFee = rule.listingFee ?? 0;

  const shippingCost = clamp(inputs.ss);
  const cogs = clamp(inputs.cg);
  const totalFees = marketplaceFee + paymentFee + listingFee;
  const net = discountedPrice + clamp(inputs.sc) - totalFees - shippingCost - cogs;
  const marginPct =
    discountedPrice > 0 ? (net / discountedPrice) * 100 : net < 0 ? -100 : 0;

  return {
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    net,
    marginPct,
  };
}

/* =========================================
   PAGE
   ========================================= */
export default function Page() {
  // concrete numeric state used for math + URL
  const [inputs, setInputs] = useState<Inputs>(() => ({
    ...DEFAULTS,
    ...readFromURL(),
  }));

  // local strings users type into inputs (for good UX)
  const [typed, setTyped] = useState<Record<keyof Inputs, string>>({
    p: inputs.p,
    pr: String(inputs.pr),
    sc: String(inputs.sc),
    ss: String(inputs.ss),
    cg: String(inputs.cg),
    tx: String(inputs.tx),
    dc: String(inputs.dc),
    tp: String(inputs.tp),
  } as any);

  // keep URL in sync
  useEffect(() => {
    writeToURL(inputs);
  }, [inputs]);

  // selected rule
  const rule = useMemo(() => RULES[inputs.p], [inputs.p]);

  const calc = useMemo(() => computeForPlatform(rule, inputs), [rule, inputs]);

  // compare across all platforms
  const compare = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = RULES[p.key];
      const c = computeForPlatform(r, inputs);
      return {
        key: p.key,
        label: p.label,
        profit: c.net,
        margin: c.marginPct,
        marketplaceFee: c.marketplaceFee,
        paymentFee: c.paymentFee,
        listingFee: c.listingFee,
        totalFees: c.totalFees,
      };
    });
  }, [inputs]);

  // update helpers
  function setPlatform(k: PlatformKey) {
    setInputs((prev) => ({ ...prev, p: k }));
    setTyped((prev) => ({ ...prev, p: k }));
  }

  function setNumber<K extends keyof Inputs>(key: K, raw: string) {
    // allow user to type any string (including empty and partial)
    setTyped((prev) => ({ ...prev, [key]: raw }));
    const n = Number(raw);
    if (Number.isFinite(n)) {
      setInputs((prev) => ({ ...prev, [key]: clamp(n) }));
    }
  }

  /* ---------- UI elements ---------- */
  const sectionBorder = 'rounded-2xl border border-purple-500/60 bg-neutral-950/40';
  const labelCls = 'text-sm text-neutral-300';
  const inputCls =
    'rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500';

  const updatedStr = new Date(RULES_UPDATED_AT).toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-purple-500 shadow-[0_0_18px_2px_rgba(168,85,247,0.8)]" />
        <h1
          className="cursor-pointer text-xl font-semibold text-neutral-100"
          onClick={() => {
            // reset to defaults
            setInputs({ ...DEFAULTS });
            setTyped({
              p: DEFAULTS.p,
              pr: String(DEFAULTS.pr),
              sc: String(DEFAULTS.sc),
              ss: String(DEFAULTS.ss),
              cg: String(DEFAULTS.cg),
              tx: String(DEFAULTS.tx),
              dc: String(DEFAULTS.dc),
              tp: String(DEFAULTS.tp),
            } as any);
          }}
          title="Reset to defaults"
        >
          FeePilot
        </h1>
      </div>

      {/* Platform + Updated */}
      <section className={`${sectionBorder} p-4 mb-6`}>
        <div className="mb-3">
          <label className={labelCls}>Platform</label>
          <select
            className={`${inputCls} mt-1 w-full`}
            value={inputs.p}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-neutral-400">
          Rules last updated: <span className="font-medium text-neutral-300">{updatedStr}</span>
        </p>
      </section>

      {/* Inputs */}
      <section className={`${sectionBorder} p-4 mb-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* price */}
          <div>
            <label className={labelCls}>Item price ($)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.pr}
              onChange={(e) => setNumber('pr', e.target.value)}
            />
          </div>
          {/* shipping charged */}
          <div>
            <label className={labelCls}>Shipping charged to buyer ($)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.sc}
              onChange={(e) => setNumber('sc', e.target.value)}
            />
          </div>
          {/* your ship cost */}
          <div>
            <label className={labelCls}>Shipping cost (your cost) ($)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.ss}
              onChange={(e) => setNumber('ss', e.target.value)}
            />
          </div>
          {/* cogs */}
          <div>
            <label className={labelCls}>COGS ($)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.cg}
              onChange={(e) => setNumber('cg', e.target.value)}
            />
          </div>
          {/* tax */}
          <div>
            <label className={labelCls}>Tax collected ($)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.tx}
              onChange={(e) => setNumber('tx', e.target.value)}
            />
          </div>
          {/* discount */}
          <div>
            <label className={labelCls}>Discount (%)</label>
            <input
              inputMode="decimal"
              className={`${inputCls} mt-1 w-full`}
              value={typed.dc}
              onChange={(e) => setNumber('dc', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className={`${sectionBorder} p-4 mb-6`}>
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">Overview</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Profit</div>
            <div className={`mt-2 text-3xl font-semibold ${moneyClass(calc.net)}`}>
              {fmtMoney(calc.net)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Margin</div>
            <div className="mt-2 text-3xl font-semibold text-neutral-100">
              {calc.marginPct.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Marketplace fee</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(calc.marketplaceFee)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Payment fee</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(calc.paymentFee)}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Listing fee</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(calc.listingFee)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Shipping cost (your cost)</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(inputs.ss)}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">COGS</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(inputs.cg)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-300">Total fees</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-100">
              {fmtMoney(calc.totalFees)}
            </div>
          </div>
        </div>
      </section>

      {/* Compare table */}
      <section className={`${sectionBorder} p-4`}>
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">Comparing with current inputs</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left text-neutral-300">
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Profit</th>
                <th className="px-3 py-2">Margin</th>
                <th className="px-3 py-2">Marketplace fee</th>
                <th className="px-3 py-2">Payment fee</th>
                <th className="px-3 py-2">Listing fee</th>
                <th className="px-3 py-2">Total fees</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.key} className="border-t border-neutral-800">
                  <td className="px-3 py-2">
                    <span className="inline-block rounded-lg border border-neutral-800 bg-neutral-950/60 px-2 py-1 text-neutral-100">
                      {row.label}
                    </span>
                  </td>
                  <td className={`px-3 py-2 font-medium ${moneyClass(row.profit)}`}>
                    {fmtMoney(row.profit)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="px-3 py-2 text-right">{row.margin.toFixed(1)}%</div>
                  </td>
                  <td className="px-3 py-2">{fmtMoney(row.marketplaceFee)}</td>
                  <td className="px-3 py-2">{fmtMoney(row.paymentFee)}</td>
                  <td className="px-3 py-2">{fmtMoney(row.listingFee)}</td>
                  <td className="px-3 py-2">{fmtMoney(row.totalFees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-6">
        <Footer />
      </div>
    </main>
  );
}
