'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  PlatformKey,
  FeeRule,
} from '@/data/fees';

// ---------- helpers ----------
function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

function toNum(v: string | number) {
  const n = typeof v === 'number' ? v : parseFloat(v || '0');
  return clamp(n);
}

function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `(${s})` : s;
}

// shorter query keys
type QueryKeys = 'p' | 'sc' | 'ss' | 'cg' | 'tx' | 'dc' | 'tp' | 'plat';

function readQuery(): Record<QueryKeys, string> {
  const sp =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  return {
    plat: sp.get('plat') || '',
    p: sp.get('p') || '',
    sc: sp.get('sc') || '',
    ss: sp.get('ss') || '',
    cg: sp.get('cg') || '',
    tx: sp.get('tx') || '',
    dc: sp.get('dc') || '',
    tp: sp.get('tp') || '',
  } as Record<QueryKeys, string>;
}

function writeQuery(q: Partial<Record<QueryKeys, string>>) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  Object.entries(q).forEach(([k, v]) => {
    if (!v || v === '0') sp.delete(k);
    else sp.set(k, v);
  });
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', url);
}

type Inputs = {
  p: number; // price
  sc: number; // shipping charged to buyer
  ss: number; // your shipping cost
  cg: number; // cost of goods
  tx: number; // tax collected
  dc: number; // discount pct (0-100)
  tp: number; // target profit (for backsolve)
};

function calc(rule: FeeRule, platform: PlatformKey, inputs: Inputs) {
  // effective sale (after discount + buyer-paid ship + tax)
  const discount = inputs.p * (inputs.dc / 100);
  const subtotal = inputs.p - discount + inputs.sc + inputs.tx;

  const marketplaceFee = subtotal * rule.marketplacePct;

  // payment fee = pct * subtotal + fixed
  const paymentFee = subtotal * rule.paymentPct + (rule.paymentFixed ?? 0);

  // listing fee is usually fixed per listing
  const listingFee = rule.listingFixed ?? 0;

  // your shipping cost (you pay this)
  const shippingCost = inputs.ss;

  const cogs = inputs.cg;

  const totalFees = marketplaceFee + paymentFee + listingFee + shippingCost + cogs;
  const net = subtotal - totalFees;
  const margin = subtotal !== 0 ? (net / subtotal) * 100 : 0;

  return {
    platform,
    subtotal,
    discount,
    marketplaceFee,
    paymentFee,
    listingFee,
    shippingCost,
    cogs,
    totalFees,
    net,
    margin,
  };
}

export default function Page() {
  // initial from URL (if present)
  const q = readQuery();

  const [platform, setPlatform] = useState<PlatformKey>(
    (PLATFORMS.find((p) => p.key === q.plat)?.key as PlatformKey) || 'etsy'
  );

  const [inputs, setInputs] = useState<Inputs>({
    p: q.p ? toNum(q.p) : 200,
    sc: q.sc ? toNum(q.sc) : 0,
    ss: q.ss ? toNum(q.ss) : 10,
    cg: q.cg ? toNum(q.cg) : 40,
    tx: q.tx ? toNum(q.tx) : 0,
    dc: q.dc ? toNum(q.dc) : 0,
    tp: q.tp ? toNum(q.tp) : 50,
  });

  // keep URL in sync (short keys)
  useEffect(() => {
    writeQuery({
      plat: platform,
      p: String(inputs.p),
      sc: String(inputs.sc),
      ss: String(inputs.ss),
      cg: String(inputs.cg),
      tx: String(inputs.tx),
      dc: String(inputs.dc),
      tp: String(inputs.tp),
    });
  }, [platform, inputs]);

  const rule = RULES[platform];
  const result = useMemo(() => calc(rule, platform, inputs), [rule, platform, inputs]);

  // comparison rows for all platforms
  const compareRows = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = calc(RULES[p.key], p.key, inputs);
      return {
        key: p.key,
        label: p.label,
        profit: r.net,
        margin: r.margin,
        marketplaceFee: r.marketplaceFee,
        paymentFee: r.paymentFee,
        listingFee: r.listingFee,
        totalFees: r.totalFees,
      };
    });
  }, [inputs]);

  const sectionBox =
    'rounded-2xl border border-purple-500/30 shadow-[0_0_0_1px_rgba(168,85,247,0.25)_inset] bg-neutral-950/40 backdrop-blur';

  const inputCls =
    'rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500';
  const labelCls = 'text-sm text-neutral-400';

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* header */}
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
          <h1 className="text-2xl font-semibold">FeePilot</h1>
        </div>

        {/* Platform + updated */}
        <section className={sectionBox}>
          <div className="space-y-4 p-5 md:p-6">
            <h2 className="text-lg font-medium">Platform</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="max-w-xs rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-purple-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformKey)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-neutral-400">
                Rules last updated: <span className="font-medium">{RULES_UPDATED_AT}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Inputs + Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Inputs */}
          <section className={sectionBox}>
            <div className="p-5 md:p-6">
              <h2 className="mb-4 text-lg font-medium">Inputs</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Item price ($)"
                  value={inputs.p}
                  onChange={(n) => setInputs((s) => ({ ...s, p: n }))}
                />
                <Field
                  label="Shipping charged to buyer ($)"
                  value={inputs.sc}
                  onChange={(n) => setInputs((s) => ({ ...s, sc: n }))}
                />
                <Field
                  label="Your shipping cost ($)"
                  value={inputs.ss}
                  onChange={(n) => setInputs((s) => ({ ...s, ss: n }))}
                />
                <Field
                  label="Cost of goods ($)"
                  value={inputs.cg}
                  onChange={(n) => setInputs((s) => ({ ...s, cg: n }))}
                />
                <Field
                  label="Tax collected ($)"
                  value={inputs.tx}
                  onChange={(n) => setInputs((s) => ({ ...s, tx: n }))}
                />
                <Field
                  label="Discount (%)"
                  value={inputs.dc}
                  onChange={(n) => setInputs((s) => ({ ...s, dc: n }))}
                />
                <Field
                  label="Target profit ($) — backsolve"
                  value={inputs.tp}
                  onChange={(n) => setInputs((s) => ({ ...s, tp: n }))}
                />
              </div>
            </div>
          </section>

          {/* Overview */}
          <section className={sectionBox}>
            <div className="p-5 md:p-6">
              <h2 className="mb-4 text-lg font-medium">Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <Stat
                  label="Profit"
                  value={result.net}
                  big
                  negativeRed
                />
                <Stat label="Margin" value={`${result.margin.toFixed(1)}%`} />
                <Stat label="Marketplace fee" value={result.marketplaceFee} />
                <Stat label="Payment fee" value={result.paymentFee} />
                <Stat label="Listing fee" value={result.listingFee} />
                <Stat label="Shipping cost (your cost)" value={result.shippingCost} />
                <Stat label="COGS" value={result.cogs} />
                <Stat label="Total fees" value={result.totalFees} />
              </div>
            </div>
          </section>
        </div>

        {/* Comparison */}
        <section className={sectionBox}>
          <div className="p-5 md:p-6">
            <h2 className="mb-4 text-lg font-medium">Compare across platforms</h2>
            <p className="mb-3 text-sm text-neutral-400">
              Comparing with current inputs (
              <span className="font-medium">{fmtMoney(inputs.p)}</span> price,{' '}
              <span className="font-medium">{fmtMoney(inputs.sc)}</span> ship charge,{' '}
              <span className="font-medium">{fmtMoney(inputs.ss)}</span> ship cost,{' '}
              <span className="font-medium">{fmtMoney(inputs.cg)}</span> COGS,{' '}
              <span className="font-medium">{inputs.dc}%</span> discount,{' '}
              <span className="font-medium">{fmtMoney(inputs.tx)}</span> tax).
            </p>

            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="min-w-full divide-y divide-neutral-800 text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <Th>Platform</Th>
                    <Th className="text-right">Profit</Th>
                    <Th className="text-right">Margin</Th>
                    <Th className="text-right">Marketplace fee</Th>
                    <Th className="text-right">Payment fee</Th>
                    <Th className="text-right">Listing fee</Th>
                    {/* moved to the end */}
                    <Th className="text-right">Total fees</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/70">
                  {compareRows.map((row) => (
                    <tr key={row.key} className="hover:bg-neutral-900/30">
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-neutral-800/70 px-2.5 py-1 text-xs">
                          {PLATFORMS.find((p) => p.key === row.key)?.label ?? row.key}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={
                            row.profit < 0 ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'
                          }
                        >
                          {fmtMoney(row.profit)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.margin.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right">{fmtMoney(row.marketplaceFee)}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(row.paymentFee)}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(row.listingFee)}</td>
                      {/* total fees at the end */}
                      <td className="px-3 py-2 text-right">{fmtMoney(row.totalFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ---------- small components ----------

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        inputMode="decimal"
      />
    </label>
  );
}

function Stat({
  label,
  value,
  big = false,
  negativeRed = false,
}: {
  label: string;
  value: number | string;
  big?: boolean;
  negativeRed?: boolean;
}) {
  const isNum = typeof value === 'number';
  const display = isNum ? fmtMoney(value as number) : (value as string);
  const neg = isNum && (value as number) < 0;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="text-sm text-neutral-400">{label}</div>
      <div
        className={
          'mt-1 font-semibold ' +
          (big ? 'text-3xl' : 'text-xl') +
          (negativeRed && neg ? ' text-red-400' : '')
        }
      >
        {display}
      </div>
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>
  );
}
