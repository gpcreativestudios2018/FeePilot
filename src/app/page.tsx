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
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, min), max);
}

function parseNum(v: string | number | null | undefined, fallback = 0) {
  if (typeof v === 'number') return clamp(v);
  if (typeof v === 'string') {
    const n = Number(v);
    return clamp(Number.isFinite(n) ? n : fallback);
  }
  return fallback;
}

function fmtMoney(n: number) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const s = `$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return neg ? `(${s.slice(1)})` : s; // parentheses when negative
}

// URL keys (short)
const QK = {
  p: 'p',   // price
  sc: 'sc', // ship charged to buyer
  ss: 'ss', // shipping cost (seller)
  cg: 'cg', // COGS
  tx: 'tx', // tax
  dc: 'dc', // discount pct (0-100)
  tp: 'tp', // target profit (backsolve)
  pf: 'pf', // platform
} as const;

type Inputs = {
  p: number;
  sc: number;
  ss: number;
  cg: number;
  tx: number;
  dc: number;
  tp: number;
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

function readInputsFromURL(): { platform: PlatformKey; inputs: Inputs } {
  const url = new URL(window.location.href);
  const platform = (url.searchParams.get(QK.pf) as PlatformKey) || 'etsy';
  const inputs: Inputs = {
    p: parseNum(url.searchParams.get(QK.p) || DEFAULT_INPUTS.p, DEFAULT_INPUTS.p),
    sc: parseNum(url.searchParams.get(QK.sc) || DEFAULT_INPUTS.sc, DEFAULT_INPUTS.sc),
    ss: parseNum(url.searchParams.get(QK.ss) || DEFAULT_INPUTS.ss, DEFAULT_INPUTS.ss),
    cg: parseNum(url.searchParams.get(QK.cg) || DEFAULT_INPUTS.cg, DEFAULT_INPUTS.cg),
    tx: parseNum(url.searchParams.get(QK.tx) || DEFAULT_INPUTS.tx, DEFAULT_INPUTS.tx),
    dc: parseNum(url.searchParams.get(QK.dc) || DEFAULT_INPUTS.dc, DEFAULT_INPUTS.dc),
    tp: parseNum(url.searchParams.get(QK.tp) || DEFAULT_INPUTS.tp, DEFAULT_INPUTS.tp),
  };
  return { platform, inputs };
}

function writeInputsToURL(platform: PlatformKey, inputs: Inputs) {
  const url = new URL(window.location.href);
  url.searchParams.set(QK.pf, platform);
  url.searchParams.set(QK.p, String(inputs.p));
  url.searchParams.set(QK.sc, String(inputs.sc));
  url.searchParams.set(QK.ss, String(inputs.ss));
  url.searchParams.set(QK.cg, String(inputs.cg));
  url.searchParams.set(QK.tx, String(inputs.tx));
  url.searchParams.set(QK.dc, String(inputs.dc));
  url.searchParams.set(QK.tp, String(inputs.tp));
  history.replaceState(null, '', url.toString());
}

type Calc = {
  profit: number;
  margin: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  shippingCost: number; // your cost
  cogs: number;
  totalFees: number;
  net: number;
};

function compute(platform: PlatformKey, inputs: Inputs): Calc {
  const rule: FeeRule = RULES[platform];
  const price = clamp(inputs.p);
  const shipCharged = clamp(inputs.sc);
  const shippingCost = clamp(inputs.ss);
  const cogs = clamp(inputs.cg);
  const tax = clamp(inputs.tx);
  const discountPct = Math.max(0, Math.min(100, inputs.dc)) / 100;

  // Discount reduces price charged to buyer
  const discountedPrice = price * (1 - discountPct);

  // Listing fee (fixed)
  const listingFee = rule.listingFixed ?? 0;

  // Marketplace fee is % of (item price + shipping charged + tax) AFTER discount
  const marketplaceBase = discountedPrice + shipCharged + tax;
  const marketplaceFee = marketplaceBase * (rule.marketplacePct ?? 0);

  // Payment fee = % of marketplaceBase + fixed
  const paymentFee =
    marketplaceBase * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0);

  const totalFees = listingFee + marketplaceFee + paymentFee;
  // Net received from buyer (item + shipping charged + tax) minus fees and your ship cost
  const net = discountedPrice + shipCharged + tax - totalFees - shippingCost;

  const profit = net - cogs;
  const revenueBasis = discountedPrice + shipCharged; // don't count tax toward "revenue" margin baseline
  const margin = revenueBasis > 0 ? (profit / revenueBasis) * 100 : 0;

  return {
    profit,
    margin,
    marketplaceFee,
    paymentFee,
    listingFee,
    shippingCost,
    cogs,
    totalFees,
    net,
  };
}

// Reusable input control
function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-neutral-300">{label}</div>
      <input
        value={String(value)}
        onChange={(e) => onChange(parseNum(e.target.value))}
        inputMode="decimal"
        className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
      />
    </div>
  );
}

// Purple panel wrapper (pops more)
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-purple-500/70 ring-2 ring-purple-400/40 shadow-[0_0_0_6px_rgba(168,85,247,0.15)] bg-neutral-950/60">
      {children}
    </div>
  );
}

export default function Page() {
  const initial = useMemo(() => {
    if (typeof window === 'undefined') {
      return { platform: 'etsy' as PlatformKey, inputs: DEFAULT_INPUTS };
    }
    return readInputsFromURL();
  }, []);

  const [platform, setPlatform] = useState<PlatformKey>(initial.platform);
  const [inputs, setInputs] = useState<Inputs>(initial.inputs);

  useEffect(() => {
    if (typeof window !== 'undefined') writeInputsToURL(platform, inputs);
  }, [platform, inputs]);

  const calc = useMemo(() => compute(platform, inputs), [platform, inputs]);

  // Compare across platforms (keep total fees column at the end)
  const compareRows = useMemo(() => {
    return (Object.keys(RULES) as PlatformKey[]).map((pf) => {
      const c = compute(pf, inputs);
      return {
        pf,
        profit: c.profit,
        margin: c.margin,
        marketplaceFee: c.marketplaceFee,
        paymentFee: c.paymentFee,
        listingFee: c.listingFee,
        totalFees: c.totalFees,
      };
    });
  }, [inputs]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl p-6 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            <h1 className="text-2xl font-semibold">FeePilot</h1>
          </div>
          <div className="text-sm text-neutral-400">
            Rules last updated: {RULES_UPDATED_AT}
          </div>
        </div>

        {/* Platform + Inputs */}
        <Panel>
          <div className="p-5 space-y-6">
            <div className="space-y-2">
              <div className="text-sm text-neutral-300">Platform</div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformKey)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MoneyInput
                label="Item price ($)"
                value={inputs.p}
                onChange={(v) => setInputs((s) => ({ ...s, p: v }))}
              />
              <MoneyInput
                label="Shipping charged to buyer ($)"
                value={inputs.sc}
                onChange={(v) => setInputs((s) => ({ ...s, sc: v }))}
              />
              <MoneyInput
                label="Your shipping cost ($)"
                value={inputs.ss}
                onChange={(v) => setInputs((s) => ({ ...s, ss: v }))}
              />
              <MoneyInput
                label="COGS ($)"
                value={inputs.cg}
                onChange={(v) => setInputs((s) => ({ ...s, cg: v }))}
              />
              <MoneyInput
                label="Tax collected ($)"
                value={inputs.tx}
                onChange={(v) => setInputs((s) => ({ ...s, tx: v }))}
              />
              <MoneyInput
                label="Discount (%)"
                value={inputs.dc}
                onChange={(v) =>
                  setInputs((s) => ({ ...s, dc: clamp(v, 0, 100) }))
                }
              />
            </div>
          </div>
        </Panel>

        {/* Overview */}
        <Panel>
          <div className="p-5">
            <h2 className="mb-4 text-xl font-semibold">Overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Profit */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Profit</div>
                <div
                  className={
                    'mt-2 text-3xl font-bold ' +
                    (calc.profit < 0 ? 'text-red-400' : 'text-emerald-400')
                  }
                >
                  {fmtMoney(calc.profit)}
                </div>
              </div>

              {/* Margin */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Margin</div>
                <div className="mt-2 text-3xl font-bold">
                  {calc.margin.toFixed(1)}%
                </div>
              </div>

              {/* Marketplace fee */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Marketplace fee</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.marketplaceFee)}</div>
              </div>

              {/* Payment fee */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Payment fee</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.paymentFee)}</div>
              </div>

              {/* Listing fee */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Listing fee</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.listingFee)}</div>
              </div>

              {/* Shipping cost (your cost) */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Shipping cost (your cost)</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.shippingCost)}</div>
              </div>

              {/* COGS */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">COGS</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.cogs)}</div>
              </div>

              {/* Total fees */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="text-neutral-300">Total fees</div>
                <div className="mt-2 text-2xl">{fmtMoney(calc.totalFees)}</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Comparison */}
        <Panel>
          <div className="p-5">
            <div className="mb-4 text-neutral-300">
              Comparing with current inputs (
              <b>{fmtMoney(inputs.p)}</b> price, <b>{fmtMoney(inputs.sc)}</b> ship
              charge, <b>{fmtMoney(inputs.ss)}</b> ship cost,{' '}
              <b>{fmtMoney(inputs.cg)}</b> COGS, {inputs.dc}% discount,{' '}
              {fmtMoney(inputs.tx)} tax).
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead className="text-left text-sm text-neutral-400">
                  <tr>
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
                  {compareRows.map((row) => (
                    <tr key={row.pf} className="rounded-xl bg-neutral-950/60">
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-lg bg-neutral-900/70 px-3 py-1">
                          {PLATFORMS.find((p) => p.key === row.pf)?.label ?? row.pf}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-emerald-400">
                        {fmtMoney(row.profit)}
                      </td>
                      <td className="px-3 py-2">{row.margin.toFixed(1)}%</td>
                      <td className="px-3 py-2">{fmtMoney(row.marketplaceFee)}</td>
                      <td className="px-3 py-2">{fmtMoney(row.paymentFee)}</td>
                      <td className="px-3 py-2">{fmtMoney(row.listingFee)}</td>
                      <td className="px-3 py-2">{fmtMoney(row.totalFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        {/* Footer */}
        <div className="pb-10 text-center text-sm text-neutral-500">
          Made by <span className="text-purple-400">FeePilot</span>.
        </div>
      </div>
    </main>
  );
}
