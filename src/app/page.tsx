/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useState } from 'react';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from './data/fees';

// ---------- helpers ----------
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;

const toNum = (v: unknown) => clamp(parseFloat(String(v ?? '')) || 0);

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const brandPurple = 'ring-1 ring-purple-500/70 rounded-2xl shadow-[0_0_0_2px_rgba(168,85,247,.25)]';

// ---------- types for local UI state ----------
type Inputs = {
  price: number;        // item price
  shipCharge: number;   // shipping charged to buyer
  shipCost: number;     // shipping you pay
  cogs: number;         // your cost
  discount: number;     // % discount off item price (0-100)
  tax: number;          // % marketplace tax on buyer total (0-100)
  platform: PlatformKey;
};

// ---------- defaults ----------
const DEFAULTS: Inputs = {
  price: 200,
  shipCharge: 0,
  shipCost: 10,
  cogs: 12,
  discount: 0,
  tax: 0,
  platform: 'etsy' as PlatformKey,
};

// read querystring (deep-link) if present
const readFromQuery = (): Partial<Inputs> => {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  return {
    price: toNum(q.get('p')),
    shipCharge: toNum(q.get('sc')),
    shipCost: toNum(q.get('ss')),
    cogs: toNum(q.get('c')),
    discount: toNum(q.get('d')),
    tax: toNum(q.get('t')),
    platform: (q.get('pf') as PlatformKey) || undefined,
  };
};

// ---------- fee engine ----------
function computeFees(rule: FeeRule, inputs: Inputs) {
  // price after discount
  const discountedPrice = inputs.price * (1 - clamp(inputs.discount, 0, 100) / 100);

  // marketplace fee base = discounted item price + shipping charged + tax (if any)
  const marketplaceBase =
    discountedPrice + clamp(inputs.shipCharge, 0) + (discountedPrice * clamp(inputs.tax, 0, 100)) / 100;

  // Allow optional “fixed” knobs even if the FeeRule type didn't include them yet
  const marketplaceFixed = (rule as any).marketplaceFixed ?? 0;
  const paymentFixed = (rule as any).paymentFixed ?? 0;
  const listingFee = (rule as any).listingFee ?? 0;

  const marketplaceFee = (marketplaceBase * ((rule as any).marketplacePct ?? 0)) / 100 + marketplaceFixed;
  const paymentFee = (discountedPrice * ((rule as any).paymentPct ?? 0)) / 100 + paymentFixed;

  const totalFees = marketplaceFee + paymentFee + listingFee;
  const profit = discountedPrice + inputs.shipCharge - inputs.shipCost - inputs.cogs - totalFees;

  const margin = discountedPrice === 0 ? 0 : (profit / discountedPrice) * 100;

  return {
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    profit,
    margin,
  };
}

export default function Page() {
  // -------- state --------
  const seed = useMemo(readFromQuery, []);
  const [inputs, setInputs] = useState<Inputs>({ ...DEFAULTS, ...seed });

  // -------- reset (clicking the logo) --------
  const resetAll = () => {
    setInputs({ ...DEFAULTS });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  };

  // -------- deep link builders for Share / Copy --------
  const buildLink = (): string => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('p', String(inputs.price));
    url.searchParams.set('sc', String(inputs.shipCharge));
    url.searchParams.set('ss', String(inputs.shipCost));
    url.searchParams.set('c', String(inputs.cogs));
    url.searchParams.set('d', String(inputs.discount));
    url.searchParams.set('t', String(inputs.tax));
    url.searchParams.set('pf', inputs.platform);
    return url.toString();
  };

  const shareLink = async (): Promise<string> => {
    const link = buildLink();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FeePilot', url: link });
      } catch {
        // user closed/cancelled
      }
    }
    return link;
  };

  const copyLink = async (): Promise<string> => {
    const link = buildLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // no-op
    }
    return link;
  };

  // -------- derived (overview for selected platform) --------
  const selectedRule = RULES[inputs.platform];
  const overview = useMemo(() => computeFees(selectedRule, inputs), [selectedRule, inputs]);

  // -------- compare all platforms --------
  const rows = useMemo(
    () =>
      PLATFORMS.map((p) => {
        const r = RULES[p];
        const calc = computeFees(r, inputs);
        return {
          key: p,
          label: (r as any).label ?? p,
          ...calc,
        };
      }),
    [inputs]
  );

  // green vs red money
  const moneyClass = (n: number) =>
    n >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium';

  // -------- UI small pieces --------
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className={`p-5 md:p-6 bg-neutral-950/40 ${brandPurple}`}>
      <div className="text-neutral-200/80 mb-4 font-medium">{title}</div>
      {children}
    </section>
  );

  const Num: React.FC<{
    value: number;
    onChange: (n: number) => void;
    step?: number;
    suffix?: string;
    min?: number;
  }> = ({ value, onChange, step = 1, suffix, min = 0 }) => (
    <div className="flex items-center gap-2">
      <input
        inputMode="decimal"
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        value={Number.isFinite(value) ? String(value) : ''}
        onChange={(e) => onChange(toNum(e.target.value))}
        step={step}
        min={min}
      />
      {suffix ? <span className="text-neutral-400 text-sm">{suffix}</span> : null}
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={resetAll}
          className="text-xl font-semibold tracking-tight text-white/90 hover:text-white transition"
          aria-label="Reset and go home"
        >
          FeePilot
        </button>

        <HeaderActions onShare={shareLink} onCopy={copyLink} />
      </header>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Section title="Inputs">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Item price</span>
              <Num value={inputs.price} onChange={(n) => setInputs({ ...inputs, price: n })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Shipping charged</span>
              <Num value={inputs.shipCharge} onChange={(n) => setInputs({ ...inputs, shipCharge: n })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Shipping cost (you)</span>
              <Num value={inputs.shipCost} onChange={(n) => setInputs({ ...inputs, shipCost: n })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">COGS</span>
              <Num value={inputs.cogs} onChange={(n) => setInputs({ ...inputs, cogs: n })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Discount</span>
              <Num value={inputs.discount} onChange={(n) => setInputs({ ...inputs, discount: n })} suffix="%" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Tax</span>
              <Num value={inputs.tax} onChange={(n) => setInputs({ ...inputs, tax: n })} suffix="%" />
            </div>
          </div>
        </Section>

        <Section title="Platform">
          <div className="flex items-center justify-between">
            <select
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
              value={inputs.platform}
              onChange={(e) => {
                const value = e.target.value as PlatformKey;
                const next = (PLATFORMS as PlatformKey[]).includes(value) ? value : inputs.platform;
                setInputs({ ...inputs, platform: next });
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {(RULES[p] as any).label ?? p}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 text-xs text-neutral-400">
            Rules last updated:{' '}
            <span className="font-mono">{RULES_UPDATED_AT ?? ''}</span>
          </div>
        </Section>

        <Section title="Overview">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Profit</div>
              <div className={`text-2xl ${moneyClass(overview.profit)}`}>{fmtMoney(overview.profit)}</div>
            </div>
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Margin</div>
              <div className="text-2xl text-neutral-100">
                {overview.margin.toFixed(1)}%
              </div>
            </div>
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Marketplace fee</div>
              <div className="text-xl text-neutral-100">{fmtMoney(overview.marketplaceFee)}</div>
            </div>
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Payment fee</div>
              <div className="text-xl text-neutral-100">{fmtMoney(overview.paymentFee)}</div>
            </div>
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Listing fee</div>
              <div className="text-xl text-neutral-100">{fmtMoney(overview.listingFee)}</div>
            </div>
            <div className={`p-4 ${brandPurple}`}>
              <div className="text-neutral-400 text-xs">Total fees</div>
              <div className="text-xl text-neutral-100">{fmtMoney(overview.totalFees)}</div>
            </div>
          </div>
        </Section>
      </div>

      {/* Compare table */}
      <section className={`mt-6 p-5 md:p-6 bg-neutral-950/40 ${brandPurple}`}>
        <div className="mb-4 text-neutral-200/80 font-medium">
          Comparing with current inputs (
          <span className="font-mono">
            {fmtMoney(inputs.price)} price, {fmtMoney(inputs.shipCharge)} ship charge,{' '}
            {fmtMoney(inputs.shipCost)} ship cost, {fmtMoney(inputs.cogs)} COGS,{' '}
            {inputs.discount}% discount, {inputs.tax}% tax
          </span>
          ).
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="text-left">
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
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-neutral-900/60">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-lg bg-neutral-900 px-2 py-1 text-neutral-200">
                      {(RULES[row.key] as any).label ?? row.key}
                    </span>
                  </td>
                  <td className={`px-3 py-2 ${moneyClass(row.profit)}`}>{fmtMoney(row.profit)}</td>
                  <td className="px-3 py-2 text-neutral-200">{row.margin.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-neutral-200">{fmtMoney(row.marketplaceFee)}</td>
                  <td className="px-3 py-2 text-neutral-200">{fmtMoney(row.paymentFee)}</td>
                  <td className="px-3 py-2 text-neutral-200">{fmtMoney(row.listingFee)}</td>
                  <td className="px-3 py-2 text-neutral-200">{fmtMoney(row.totalFees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-8">
        <Footer />
      </div>
    </main>
  );
}
