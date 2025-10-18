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
  return Math.min(max, Math.max(min, n));
}

function toNumber(v: string | number) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(n: number) {
  // Parentheses if negative, no minus sign
  const abs = Math.abs(n);
  const base = abs.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  return n < 0 ? `(${base})` : base;
}

// Short URL query keys
const Q = {
  p: 'p', // platform
  pr: 'pr', // price
  sc: 'sc', // shipping charged to buyer
  ss: 'ss', // your shipping cost
  cg: 'cg', // cost of goods
  tx: 'tx', // tax collected
  dc: 'dc', // discount pct
  tp: 'tp', // target profit
} as const;

type Inputs = {
  platform: PlatformKey;
  price: number;
  shippingCharge: number;
  shippingCost: number;
  cogs: number;
  taxCollected: number;
  discountPct: number; // 0-100
  targetProfit: number;
};

type Calc = {
  subtotalAfterDiscountAndShipToBuyer: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  totalFees: number;
  netProceeds: number;
  profit: number;
  marginPct: number; // 0..100
};

function calcForPlatform(inputs: Inputs, rule: FeeRule): Calc {
  // Revenue components
  const gross = inputs.price + inputs.shippingCharge - inputs.taxCollected;
  const discount = (inputs.discountPct / 100) * inputs.price;
  const revenue = gross - discount;

  // Marketplace fee
  const marketplaceFee = revenue * rule.marketplacePct;

  // Payment fee
  const paymentFee =
    revenue * rule.paymentPct + (rule.paymentFixed ?? 0);

  // Listing fee (fixed)
  const listingFee = rule.listingFixed ?? 0;

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const netProceeds = revenue - totalFees;

  // Costs
  const cost = inputs.cogs + inputs.shippingCost;

  const profit = netProceeds - cost;
  const marginBase = revenue <= 0 ? 0.00001 : revenue;
  const marginPct = (profit / marginBase) * 100;

  return {
    subtotalAfterDiscountAndShipToBuyer: revenue,
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    netProceeds,
    profit,
    marginPct,
  };
}

export default function Page() {
  // -------- initial state from URL --------
  const search =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  const initial: Inputs = {
    platform: (search.get(Q.p) as PlatformKey) || 'etsy',
    price: toNumber(search.get(Q.pr) ?? 120),
    shippingCharge: toNumber(search.get(Q.sc) ?? 0),
    shippingCost: toNumber(search.get(Q.ss) ?? 10),
    cogs: toNumber(search.get(Q.cg) ?? 40),
    taxCollected: toNumber(search.get(Q.tx) ?? 0),
    discountPct: toNumber(search.get(Q.dc) ?? 0),
    targetProfit: toNumber(search.get(Q.tp) ?? 50),
  };

  const [platform, setPlatform] = useState<PlatformKey>(initial.platform);
  const [price, setPrice] = useState<number>(initial.price);
  const [shippingCharge, setShippingCharge] = useState<number>(
    initial.shippingCharge,
  );
  const [shippingCost, setShippingCost] = useState<number>(
    initial.shippingCost,
  );
  const [cogs, setCogs] = useState<number>(initial.cogs);
  const [taxCollected, setTaxCollected] = useState<number>(initial.taxCollected);
  const [discountPct, setDiscountPct] = useState<number>(initial.discountPct);
  const [targetProfit, setTargetProfit] = useState<number>(initial.targetProfit);

  // sync -> URL using short keys
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set(Q.p, platform);
    params.set(Q.pr, String(price));
    params.set(Q.sc, String(shippingCharge));
    params.set(Q.ss, String(shippingCost));
    params.set(Q.cg, String(cogs));
    params.set(Q.tx, String(taxCollected));
    params.set(Q.dc, String(discountPct));
    params.set(Q.tp, String(targetProfit));

    const qs = params.toString();
    const url = qs ? `?${qs}` : '';
    window.history.replaceState(null, '', url);
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

  const inputs: Inputs = {
    platform,
    price,
    shippingCharge,
    shippingCost,
    cogs,
    taxCollected,
    discountPct,
    targetProfit,
  };

  const rule = RULES[platform];
  const calc = useMemo(() => calcForPlatform(inputs, rule), [inputs, rule]);

  const comparisonRows = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = RULES[p.key];
      const c = calcForPlatform({ ...inputs, platform: p.key }, r);
      return {
        key: p.key,
        label: p.label,
        profit: c.profit,
        margin: c.marginPct,
        totalFees: c.totalFees,
        marketplaceFee: c.marketplaceFee,
        paymentFee: c.paymentFee,
        listingFee: c.listingFee,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [inputs]);

  // backsolve required price for a target profit
  const requiredPrice = useMemo(() => {
    // simple numeric solve by searching (safe + robust for now)
    const tryPrice = (p: number) =>
      calcForPlatform(
        { ...inputs, price: p },
        RULES[inputs.platform],
      ).profit;

    let low = 0;
    let high = 100000;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const prof = tryPrice(mid);
      if (prof < targetProfit) low = mid;
      else high = mid;
    }
    return high;
  }, [inputs, targetProfit]);

  // ---------- UI ----------

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-purple-500" />
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
            FeePilot
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            target="_blank"
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700"
          >
            Pro
          </a>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Inputs */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="mb-3 text-sm font-medium text-neutral-300">
            Platform
          </div>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            className="mb-2 w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="mb-6 text-xs text-neutral-500">
            Rules last updated:{' '}
            <span className="font-medium text-neutral-300">
              {RULES_UPDATED_AT}
            </span>
          </div>

          {/* Inputs grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Item price ($)"
              value={price}
              onChange={(v) => setPrice(clamp(toNumber(v), 0))}
            />
            <Field
              label="Shipping charged to buyer ($)"
              value={shippingCharge}
              onChange={(v) => setShippingCharge(clamp(toNumber(v), 0))}
            />
            <Field
              label="Your shipping cost ($)"
              value={shippingCost}
              onChange={(v) => setShippingCost(clamp(toNumber(v), 0))}
            />
            <Field
              label="Cost of goods ($)"
              value={cogs}
              onChange={(v) => setCogs(clamp(toNumber(v), 0))}
            />
            <Field
              label="Tax collected ($)"
              value={taxCollected}
              onChange={(v) => setTaxCollected(clamp(toNumber(v), 0))}
            />
            <Field
              label="Discount (%)"
              value={discountPct}
              onChange={(v) =>
                setDiscountPct(clamp(toNumber(v), 0, 100))
              }
            />
          </div>

          {/* Backsolve */}
          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Backsolve
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Target profit ($)"
                value={targetProfit}
                onChange={(v) => setTargetProfit(clamp(toNumber(v)))}
              />
              <div className="flex flex-col text-sm">
                <span className="mb-1 text-neutral-400">
                  Required price:
                </span>
                <span className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 font-medium text-neutral-100">
                  {fmtMoney(requiredPrice)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Overview / Breakdown */}
        <section className="space-y-4">
          {/* Overview */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-neutral-300">
                Overview
              </div>
              <div className="text-sm text-neutral-400">Margin</div>
            </div>

            <div className="mt-2 flex items-end justify-between">
              <div
                className={
                  'text-4xl font-semibold ' +
                  (calc.profit < 0 ? 'text-red-300' : 'text-emerald-300')
                }
                aria-live="polite"
              >
                {fmtMoney(calc.profit)}
              </div>
              <div className="text-2xl font-semibold text-neutral-200">
                {calc.marginPct.toFixed(1)}%
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900/60">
              <div
                className={
                  'h-2 rounded-full transition-all ' +
                  (calc.profit < 0 ? 'bg-red-500/70' : 'bg-emerald-500/70')
                }
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, calc.marginPct),
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Breakdown
            </div>
            <ul className="space-y-2 text-sm text-neutral-200">
              <Row
                label="Subtotal (after discount + tax + ship to buyer)"
                value={fmtMoney(
                  calc.subtotalAfterDiscountAndShipToBuyer,
                )}
              />
              <Row label="Marketplace fee" value={fmtMoney(calc.marketplaceFee)} />
              <Row label="Payment fee" value={fmtMoney(calc.paymentFee)} />
              <Row label="Listing fee" value={fmtMoney(calc.listingFee)} />
              <Row label="Shipping cost (your cost)" value={fmtMoney(shippingCost)} />
              <Row label="COGS" value={fmtMoney(cogs)} />
              <Row label="Total fees" value={fmtMoney(calc.totalFees)} />
              <Row
                label="Net proceeds (after fees & ship cost)"
                value={fmtMoney(calc.netProceeds)}
              />
            </ul>
          </div>
        </section>
      </div>

      {/* ====================== Compare (All Platforms) ====================== */}
      <section className="mt-10">
        <div className="mb-3 text-sm text-neutral-400">
          Comparing with current inputs (
          <span className="font-medium text-neutral-200">
            {fmtMoney(price)}
          </span>{' '}
          price,
          <span className="font-medium text-neutral-200">
            {' '}
            {fmtMoney(shippingCharge)}
          </span>{' '}
          ship charge,
          <span className="font-medium text-neutral-200">
            {' '}
            {fmtMoney(shippingCost)}
          </span>{' '}
          ship cost,
          <span className="font-medium text-neutral-200">
            {' '}
            {fmtMoney(cogs)}
          </span>{' '}
          COGS,
          <span className="font-medium text-neutral-200">
            {' '}
            {discountPct}%
          </span>{' '}
          discount,
          <span className="font-medium text-neutral-200">
            {' '}
            {fmtMoney(taxCollected)}
          </span>{' '}
          tax).
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/40">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="bg-neutral-900/40 text-neutral-300">
                <th className="px-3 py-2 text-left font-medium">Platform</th>
                <th className="px-3 py-2 text-right font-medium">Profit</th>
                <th className="px-3 py-2 text-right font-medium">Margin</th>
                <th className="px-3 py-2 text-right font-medium">Total fees</th>
                <th className="px-3 py-2 text-right font-medium">Marketplace fee</th>
                <th className="px-3 py-2 text-right font-medium">Payment fee</th>
                <th className="px-3 py-2 text-right font-medium">Listing fee</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {comparisonRows.map((row) => (
                <tr key={row.key} className="hover:bg-neutral-900/40">
                  {/* Platform name */}
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60 px-2 py-1">
                      {row.label}
                    </span>
                  </td>

                  {/* Profit */}
                  <td className="px-3 py-2 text-right">
                    {fmtMoney(row.profit)}
                  </td>

                  {/* Margin */}
                  <td className="px-3 py-2 text-right">
                    <span
                      className={
                        'inline-block rounded-lg px-2 py-1 ' +
                        (row.profit < 0
                          ? 'bg-red-950/50 text-red-300'
                          : 'bg-green-950/40 text-green-300')
                      }
                    >
                      {row.margin.toFixed(1)}%
                    </span>
                  </td>

                  {/* Total fees */}
                  <td className="px-3 py-2 text-right">
                    {fmtMoney(row.totalFees)}
                  </td>

                  {/* Marketplace fee */}
                  <td className="px-3 py-2 text-right">
                    {fmtMoney(row.marketplaceFee)}
                  </td>

                  {/* Payment fee */}
                  <td className="px-3 py-2 text-right">
                    {fmtMoney(row.paymentFee)}
                  </td>

                  {/* Listing fee */}
                  <td className="px-3 py-2 text-right">
                    {fmtMoney(row.listingFee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* ==================== End Compare (All Platforms) ==================== */}

      {/* Footer */}
      <footer className="mx-auto mt-10 max-w-5xl text-center text-sm text-neutral-500">
        Made by{' '}
        <a
          className="text-neutral-300 underline decoration-neutral-700 underline-offset-4 hover:text-neutral-100"
          href="#"
        >
          FeePilot
        </a>
        . Sporty Neon theme.
      </footer>
    </div>
  );
}

// ---------- small presentational components ----------
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        inputMode="decimal"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
