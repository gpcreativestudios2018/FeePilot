'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  PlatformKey,
  FeeRule,
} from '@/data/fees';

/* ---------------- helpers ---------------- */

function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, min), max);
}

function num(v: unknown, d = 0) {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return clamp(Number.isFinite(n) ? n : d);
}

function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  return n < 0 ? `(${s})` : s;
}

/** style class for a money value (red for negative) */
function moneyClass(n: number) {
  return n < 0 ? 'text-red-400' : 'text-green-400';
}

/* ---------- query <-> state (short keys) ---------- */
/** short keys:
 * p  = price
 * sc = shipping charged to buyer
 * ss = shipping cost (your cost)
 * cg = cost of goods
 * tx = tax collected
 * dc = discount
 * tp = target profit
 */

type Inputs = {
  p: number; // price
  sc: number; // shipping charged to buyer
  ss: number; // shipping cost (your cost)
  cg: number; // cost of goods
  tx: number; // tax collected
  dc: number; // discount
  tp: number; // target profit (for backsolve)
};

const DEFAULT_INPUTS: Inputs = {
  p: 120,
  sc: 0,
  ss: 10,
  cg: 40,
  tx: 0,
  dc: 0,
  tp: 50,
};

function readQuery(): { platform: PlatformKey; inputs: Inputs } {
  const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const platform = (sp.get('pform') as PlatformKey) || 'etsy';
  const inputs: Inputs = {
    p: num(sp.get('p'), DEFAULT_INPUTS.p),
    sc: num(sp.get('sc'), DEFAULT_INPUTS.sc),
    ss: num(sp.get('ss'), DEFAULT_INPUTS.ss),
    cg: num(sp.get('cg'), DEFAULT_INPUTS.cg),
    tx: num(sp.get('tx'), DEFAULT_INPUTS.tx),
    dc: num(sp.get('dc'), DEFAULT_INPUTS.dc),
    tp: num(sp.get('tp'), DEFAULT_INPUTS.tp),
  };
  return { platform: (platform in RULES ? platform : 'etsy') as PlatformKey, inputs };
}

function writeQuery(platform: PlatformKey, inputs: Inputs) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams();
  sp.set('pform', platform);
  sp.set('p', String(inputs.p));
  sp.set('sc', String(inputs.sc));
  sp.set('ss', String(inputs.ss));
  sp.set('cg', String(inputs.cg));
  sp.set('tx', String(inputs.tx));
  sp.set('dc', String(inputs.dc));
  sp.set('tp', String(inputs.tp));
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', url);
}

/* ---------------- fee math ---------------- */

/**
 * For a given platform fee rule + inputs, calculate fee components and profit.
 * Model:
 * - order subtotal used for marketplace fee = (price - discount + shipping charged to buyer)
 * - payment fee base = (price + shipping charged to buyer + tax)
 * - listing fee = fixed as rule.listingFee
 * - total fees = marketplace + payment + listing
 * - net proceeds = (price + shipping charged + tax) - total fees - shipping cost (your cost)
 * - profit = net proceeds - COGS
 */
function calcForPlatform(rule: FeeRule, inputs: Inputs) {
  const price = inputs.p;
  const shipChargeToBuyer = inputs.sc;
  const shipCost = inputs.ss;
  const cogs = inputs.cg;
  const taxCollected = inputs.tx;
  const discount = inputs.dc;

  // Subtotal for marketplace %
  const marketplaceBase = Math.max(0, price - discount + shipChargeToBuyer);
  let marketplaceFee = marketplaceBase * rule.marketplacePct;

  // respect min/max caps if present
  if (typeof rule.minFee === 'number') marketplaceFee = Math.max(marketplaceFee, rule.minFee);
  if (typeof rule.maxFee === 'number') marketplaceFee = Math.min(marketplaceFee, rule.maxFee);

  // Payment fee (percentage of price + buyer shipping + tax) + fixed
  const paymentBase = Math.max(0, price + shipChargeToBuyer + taxCollected);
  const paymentFee = paymentBase * rule.paymentPct + rule.paymentFixed;

  // Listing fee
  const listingFee = rule.listingFee ?? 0;

  // Total fees
  const totalFees = marketplaceFee + paymentFee + listingFee;

  // Net proceeds (after fees & your shipping cost)
  const grossCollected = price + shipChargeToBuyer + taxCollected;
  const netProceeds = grossCollected - totalFees - shipCost;

  // Profit after COGS
  const profit = netProceeds - cogs;

  // Profit margin against price (not revenue)
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return {
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    netProceeds,
    profit,
    margin,
  };
}

export default function Page() {
  const initial = useMemo(() => readQuery(), []);
  const [platform, setPlatform] = useState<PlatformKey>(initial.platform);
  const [inputs, setInputs] = useState<Inputs>(initial.inputs);

  // keep URL in sync
  useEffect(() => {
    writeQuery(platform, inputs);
  }, [platform, inputs]);

  const rule = RULES[platform];

  const result = useMemo(() => calcForPlatform(rule, inputs), [rule, inputs]);

  // Backsolve (what price to hit target profit)
  const backsolvePrice = useMemo(() => {
    // Iterate simple search around current price to find a p that reaches target profit.
    const target = inputs.tp;
    let best = inputs.p;
    let low = 0;
    let high = Math.max(10, inputs.p * 3);

    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      const r = calcForPlatform(rule, { ...inputs, p: mid });
      if (r.profit < target) {
        low = mid;
      } else {
        high = mid;
      }
      best = mid;
    }
    return best;
  }, [inputs, rule]);

  // Compare across platforms table
  const comparison = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = calcForPlatform(RULES[p.key], inputs);
      return {
        key: p.key,
        label: p.label,
        ...r,
      };
    });
  }, [inputs]);

  // UI helpers
  const inputBox = (label: string, value: number, onChange: (n: number) => void, rightLabel?: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-neutral-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(num(e.target.value))}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        inputMode="decimal"
      />
      {rightLabel ? <div className="text-xs text-neutral-500">{rightLabel}</div> : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-neutral-100">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
          <h1 className="text-2xl font-semibold">FeePilot</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Pro
          </a>
        </div>
      </header>

      {/* Platform / updated */}
      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
        <div className="mb-3 text-neutral-300">Platform</div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as PlatformKey)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        >
          {PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="mt-3 text-sm text-neutral-500">
          Rules last updated: <span className="text-neutral-300">{RULES_UPDATED_AT}</span>
        </div>
      </section>

      {/* Overview + inputs */}
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="mb-4 text-neutral-300">Inputs</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {inputBox('Item price ($)', inputs.p, (n) => setInputs({ ...inputs, p: n }))}
            {inputBox('Shipping charged to buyer ($)', inputs.sc, (n) => setInputs({ ...inputs, sc: n }))}
            {inputBox('Your shipping cost ($)', inputs.ss, (n) => setInputs({ ...inputs, ss: n }))}
            {inputBox('Cost of goods ($)', inputs.cg, (n) => setInputs({ ...inputs, cg: n }))}
            {inputBox('Tax collected ($)', inputs.tx, (n) => setInputs({ ...inputs, tx: n }))}
            {inputBox('Discount ($)', inputs.dc, (n) => setInputs({ ...inputs, dc: n }))}
          </div>
        </div>

        {/* Overview */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-neutral-300">Overview</div>
            <div className="text-neutral-400">Margin</div>
          </div>
          <div className="mb-1 flex items-baseline justify-between">
            <div className={`text-4xl font-semibold ${moneyClass(result.profit)}`}>{fmtMoney(result.profit)}</div>
            <div className="text-3xl text-neutral-200">{result.margin.toFixed(1)}%</div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-neutral-300">
            <div className="flex justify-between">
              <span>Total fees</span>
              <span>{fmtMoney(result.totalFees)}</span>
            </div>
            <div className="flex justify-between">
              <span>Marketplace fee</span>
              <span>{fmtMoney(result.marketplaceFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment fee</span>
              <span>{fmtMoney(result.paymentFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Listing fee</span>
              <span>{fmtMoney(result.listingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net proceeds (after fees & ship cost)</span>
              <span>{fmtMoney(result.netProceeds)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Backsolve */}
      <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
        <div className="mb-4 text-neutral-300">Backsolve</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {inputBox('Target profit ($)', inputs.tp, (n) => setInputs({ ...inputs, tp: n }))}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-400">Required price</label>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100">
              {fmtMoney(backsolvePrice)}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
        <div className="mb-4 text-neutral-300">
          Comparing with current inputs (
          <span className="text-neutral-100">
            {fmtMoney(inputs.p)}
          </span>{' '}
          price,{' '}
          <span className="text-neutral-100">{fmtMoney(inputs.sc)}</span> ship charge,{' '}
          <span className="text-neutral-100">{fmtMoney(inputs.ss)}</span> ship cost,{' '}
          <span className="text-neutral-100">{fmtMoney(inputs.cg)}</span> COGS,{' '}
          <span className="text-neutral-100">{((inputs.dc / Math.max(1, inputs.p)) * 100).toFixed(0)}%</span> discount,{' '}
          <span className="text-neutral-100">{fmtMoney(inputs.tx)}</span> tax).
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left">Platform</th>
                <th className="px-3 py-2 text-right">Profit</th>
                <th className="px-3 py-2 text-right">Margin</th>
                <th className="px-3 py-2 text-right">Total fees</th>
                <th className="px-3 py-2 text-right">Marketplace fee</th>
                <th className="px-3 py-2 text-right">Payment fee</th>
                <th className="px-3 py-2 text-right">Listing fee</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.key} className="border-b border-neutral-900">
                  <td className="px-3 py-2">
                    <span className="rounded-md border border-neutral-800 px-2 py-1 text-neutral-200">
                      {row.label}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right ${moneyClass(row.profit)}`}>{fmtMoney(row.profit)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="text-neutral-200">{row.margin.toFixed(1)}%</div>
                  </td>
                  <td className="px-3 py-2 text-right">{fmtMoney(row.totalFees)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(row.marketplaceFee)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(row.paymentFee)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(row.listingFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
