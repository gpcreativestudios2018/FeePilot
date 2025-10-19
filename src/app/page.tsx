/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';

import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';

import {
  PLATFORMS,
  RULES,
  // If your data file exports PlatformKey, keep this import.
  // Otherwise this local union keeps types happy.
  // PlatformKey,
} from '../data/fees';

// If your fees.ts already exports PlatformKey, feel free to remove this local type:
type PlatformKey = 'etsy' | 'stockx' | 'ebay' | 'poshmark' | 'depop' | 'mercari';

/* ---------------- helpers ---------------- */

const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));

const toMoney = (n: number) =>
  n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

function moneyMaybeParens(n: number) {
  if (n < 0) return `(${toMoney(Math.abs(n))})`;
  return toMoney(n);
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

// robust numeric parsing for inputs (allows multi-digit typing & deletes)
function parseNumericInput(raw: string) {
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/* ---------- short query keys (compact URLs) ---------- */
const QK = {
  p: 'price',
  sc: 'shipCharge',
  ss: 'shipCost',
  cg: 'cogs',
  tx: 'tax',
  dc: 'discount',
  tp: 'targetProfit',
  pl: 'platform',
} as const;

type Inputs = {
  platform: PlatformKey;
  price: number;
  shipCharge: number; // charged to buyer
  shipCost: number; // your cost
  cogs: number;
  tax: number;
  discount: number; // 0..1
  targetProfit: number;
};

const DEFAULTS: Inputs = {
  platform: 'etsy',
  price: 120,
  shipCharge: 0,
  shipCost: 10,
  cogs: 40,
  tax: 0,
  discount: 0,
  targetProfit: 50,
};

/* ---------------- computation ---------------- */

function computeForPlatform(inputs: Inputs, platform: PlatformKey) {
  const rule: any = RULES[platform];

  const discounted = clamp(inputs.price * (1 - clamp(inputs.discount, 0, 1)), 0, 1_000_000);

  // Marketplace fee is % of (discounted price + shipping charged + tax)
  const marketplaceBase = discounted + inputs.shipCharge + inputs.tax;
  const marketplaceFee =
    marketplaceBase * (rule.marketplacePct ?? 0) + (rule.marketplaceFixed ?? 0);

  // Payment fee is % of discounted price + optional fixed
  const paymentFee = discounted * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0);

  // Listing fee (often fixed)
  const listingFee = rule.listingFee ?? 0;

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const revenue = inputs.price + inputs.shipCharge;
  const costs = totalFees + inputs.shipCost + inputs.cogs;
  const profit = revenue - costs;

  const margin = revenue > 0 ? profit / revenue : 0;

  return {
    platform,
    profit,
    margin,
    totalFees,
    marketplaceFee,
    paymentFee,
    listingFee,
  };
}

function computeAll(inputs: Inputs) {
  const current = computeForPlatform(inputs, inputs.platform);
  const compareRows = PLATFORMS.map((p) => computeForPlatform(inputs, p.key as PlatformKey));
  return { current, compareRows };
}

/* ---------------- URL sync (compact) ---------------- */

function encodeToQuery(i: Inputs) {
  const sp = new URLSearchParams();
  sp.set('p', String(i.price));
  sp.set('sc', String(i.shipCharge));
  sp.set('ss', String(i.shipCost));
  sp.set('cg', String(i.cogs));
  sp.set('tx', String(i.tax));
  sp.set('dc', String(i.discount));
  sp.set('tp', String(i.targetProfit));
  sp.set('pl', i.platform);
  return sp.toString();
}

function decodeFromQuery(): Partial<Inputs> {
  try {
    const url = new URL(window.location.href);
    const g = (k: string) => url.searchParams.get(k);
    const pl = g('pl') as PlatformKey | null;

    const decoded: Partial<Inputs> = {};
    if (pl && ['etsy', 'stockx', 'ebay', 'poshmark', 'depop', 'mercari'].includes(pl))
      decoded.platform = pl;

    const numKeys: Array<keyof typeof QK> = ['p', 'sc', 'ss', 'cg', 'tx', 'dc', 'tp'];
    numKeys.forEach((k) => {
      const v = g(k);
      if (v != null) {
        const n = Number(v);
        if (Number.isFinite(n)) {
          const key = QK[k] as keyof Inputs;
          (decoded as any)[key] = n;
        }
      }
    });

    return decoded;
  } catch {
    return {};
  }
}

/* ---------------- UI ---------------- */

export default function Page() {
  // string states for inputs to allow fluid multi-digit typing
  const [platform, setPlatform] = useState<PlatformKey>(DEFAULTS.platform);
  const [price, setPrice] = useState<string>(String(DEFAULTS.price));
  const [shipCharge, setShipCharge] = useState<string>(String(DEFAULTS.shipCharge));
  const [shipCost, setShipCost] = useState<string>(String(DEFAULTS.shipCost));
  const [cogs, setCogs] = useState<string>(String(DEFAULTS.cogs));
  const [tax, setTax] = useState<string>(String(DEFAULTS.tax));
  const [discount, setDiscount] = useState<string>(String(DEFAULTS.discount));
  const [targetProfit, setTargetProfit] = useState<string>(String(DEFAULTS.targetProfit));

  // on mount: pull from URL (if present)
  useEffect(() => {
    const q = decodeFromQuery();
    if (q.platform) setPlatform(q.platform);
    if (q.price != null) setPrice(String(q.price));
    if (q.shipCharge != null) setShipCharge(String(q.shipCharge));
    if (q.shipCost != null) setShipCost(String(q.shipCost));
    if (q.cogs != null) setCogs(String(q.cogs));
    if (q.tax != null) setTax(String(q.tax));
    if (q.discount != null) setDiscount(String(q.discount));
    if (q.targetProfit != null) setTargetProfit(String(q.targetProfit));
  }, []);

  // derived numeric inputs
  const numericInputs: Inputs = useMemo(
    () => ({
      platform,
      price: clamp(parseNumericInput(price) || 0, 0),
      shipCharge: clamp(parseNumericInput(shipCharge) || 0, 0),
      shipCost: clamp(parseNumericInput(shipCost) || 0, 0),
      cogs: clamp(parseNumericInput(cogs) || 0, 0),
      tax: clamp(parseNumericInput(tax) || 0, 0),
      discount: clamp(parseNumericInput(discount) || 0, 0, 1),
      targetProfit: clamp(parseNumericInput(targetProfit) || 0, -1_000_000, 1_000_000),
    }),
    [platform, price, shipCharge, shipCost, cogs, tax, discount, targetProfit]
  );

  // push compact query (no page reload)
  useEffect(() => {
    const qs = encodeToQuery(numericInputs);
    const url = `${window.location.pathname}?${qs}`;
    window.history.replaceState({}, '', url);
  }, [numericInputs]);

  const { current, compareRows } = useMemo(() => computeAll(numericInputs), [numericInputs]);

  function resetAll() {
    setPlatform(DEFAULTS.platform);
    setPrice(String(DEFAULTS.price));
    setShipCharge(String(DEFAULTS.shipCharge));
    setShipCost(String(DEFAULTS.shipCost));
    setCogs(String(DEFAULTS.cogs));
    setTax(String(DEFAULTS.tax));
    setDiscount(String(DEFAULTS.discount));
    setTargetProfit(String(DEFAULTS.targetProfit));
  }

  const labelCls = 'text-sm text-neutral-300';
  const inputCls =
    'rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500';
  const card =
    'rounded-2xl border border-neutral-900/70 bg-neutral-950/60 ring-1 ring-purple-500/35 p-5 shadow-sm';

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 text-neutral-100">
      {/* Header row with brand + actions */}
      <header className="mb-6 flex items-center gap-3">
        <h1
          className="cursor-pointer select-none text-xl font-semibold text-neutral-100"
          onClick={resetAll}
          title="Reset to defaults"
        >
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-purple-500 align-middle" />
          FeePilot
        </h1>

        <HeaderActions />
      </header>

      {/* Platform & rules updated */}
      <section className={`${card} mb-6`}>
        <div className="mb-3">
          <div className="text-neutral-300">Platform</div>
          <select
            className={`${inputCls} mt-2 w-full`}
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="mt-2 text-sm text-neutral-400">
            Rules last updated: <span className="font-mono">{RULES.updatedAt ?? ''}</span>
          </div>
        </div>
      </section>

      {/* Inputs + Overview */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-neutral-200">Inputs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={labelCls}>Item price ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <div className={labelCls}>Shipping charged to buyer ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={shipCharge}
                onChange={(e) => setShipCharge(e.target.value)}
              />
            </div>

            <div>
              <div className={labelCls}>Your shipping cost ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={shipCost}
                onChange={(e) => setShipCost(e.target.value)}
              />
            </div>

            <div>
              <div className={labelCls}>Cost of goods ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={cogs}
                onChange={(e) => setCogs(e.target.value)}
              />
            </div>

            <div>
              <div className={labelCls}>Tax collected ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>

            <div>
              <div className={labelCls}>Discount (%)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.10 for 10%"
              />
            </div>

            <div className="col-span-2">
              <div className={labelCls}>Target profit ($)</div>
              <input
                inputMode="decimal"
                className={`${inputCls} mt-1 w-full`}
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-4 text-lg font-semibold text-neutral-200">Overview</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Profit</div>
              <div
                className={`mt-1 text-3xl font-semibold ${
                  current.profit < 0 ? 'text-red-400' : 'text-green-400'
                }`}
                data-testid="profit"
              >
                {moneyMaybeParens(current.profit)}
              </div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Margin</div>
              <div className="mt-1 text-3xl font-semibold text-neutral-100">
                {pct(current.margin)}
              </div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Marketplace fee</div>
              <div className="mt-1 text-xl">{toMoney(current.marketplaceFee)}</div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Payment fee</div>
              <div className="mt-1 text-xl">{toMoney(current.paymentFee)}</div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Listing fee</div>
              <div className="mt-1 text-xl">{toMoney(current.listingFee)}</div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25`}>
              <div className={labelCls}>Shipping cost (your cost)</div>
              <div className="mt-1 text-xl">{toMoney(numericInputs.shipCost)}</div>
            </div>

            <div className={`${card} border-neutral-900/50 ring-purple-500/25 col-span-2`}>
              <div className={labelCls}>Total fees</div>
              <div className="mt-1 text-2xl">{toMoney(current.totalFees)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare table */}
      <section className={`${card} mt-6 overflow-x-auto`}>
        <div className="mb-3 text-neutral-300">
          Comparing with current inputs (
          <span className="font-semibold">{toMoney(numericInputs.price)}</span> price,{' '}
          <span className="font-semibold">{toMoney(numericInputs.shipCharge)}</span> ship charge,{' '}
          <span className="font-semibold">{toMoney(numericInputs.shipCost)}</span> ship cost,{' '}
          <span className="font-semibold">{toMoney(numericInputs.cogs)}</span> COGS,{' '}
          <span className="font-semibold">{pct(numericInputs.discount)}</span> discount,{' '}
          <span className="font-semibold">{toMoney(numericInputs.tax)}</span> tax).
        </div>

        <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-y-2">
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
              <tr
                key={row.platform}
                className="rounded-xl bg-neutral-950/50 text-neutral-100 shadow ring-1 ring-purple-500/20"
              >
                <td className="px-3 py-2">
                  <span className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm">
                    {PLATFORMS.find((p) => p.key === row.platform)?.label ?? row.platform}
                  </span>
                </td>
                <td
                  className={`px-3 py-2 font-medium ${
                    row.profit < 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {moneyMaybeParens(row.profit)}
                </td>
                <td className="px-3 py-2">{pct(row.margin)}</td>
                <td className="px-3 py-2">{toMoney(row.marketplaceFee)}</td>
                <td className="px-3 py-2">{toMoney(row.paymentFee)}</td>
                <td className="px-3 py-2">{toMoney(row.listingFee)}</td>
                <td className="px-3 py-2">{toMoney(row.totalFees)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-10" />

      <Footer />
    </main>
  );
}
