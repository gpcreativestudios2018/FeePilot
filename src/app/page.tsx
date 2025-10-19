/* eslint-disable @typescript-eslint/no-explicit-any */
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

/* ---------------- helpers ---------------- */

function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  return n < 0 ? `(${s})` : s;
}

function moneyClass(n: number) {
  return n < 0 ? 'text-red-400' : 'text-emerald-400';
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

/** compact query keys */
const Q = {
  platform: 'p',
  price: 'pr',
  shipCharged: 'sc',
  shipCost: 'ss',
  cogs: 'cg',
  tax: 'tx',
  discountPct: 'dc',
  targetProfit: 'tp',
} as const;

type Inputs = {
  pr: number;   // item price
  sc: number;   // shipping charged to buyer
  ss: number;   // your shipping cost
  cg: number;   // cost of goods
  tx: number;   // tax collected
  dc: number;   // discount percent 0..100
  tp: number;   // desired profit (backsolve)
};

const DEFAULT_INPUTS: Inputs = {
  pr: 120,
  sc: 0,
  ss: 10,
  cg: 40,
  tx: 0,
  dc: 0,
  tp: 50,
};

/**
 * A number field that keeps a local string while typing,
 * then parses/clamps on blur. This avoids the “only 1 digit” issue.
 */
function NumberField(props: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  step?: number | 'any';
  hint?: string;
}) {
  const { label, value, onCommit, step = 'any', hint } = props;
  const [text, setText] = useState<string>(String(value));

  useEffect(() => {
    // keep in sync when parent changes programmatically
    setText(String(value));
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-neutral-300">{label}</label>
      <input
        value={text}
        inputMode="decimal"
        step={step as any}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text.replace(/[, ]+/g, ''));
          onCommit(Number.isFinite(n) ? n : 0);
          setText(String(Number.isFinite(n) ? n : 0));
        }}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
      />
      {hint ? <div className="text-xs text-neutral-500">{hint}</div> : null}
    </div>
  );
}

/* ---------------- main page ---------------- */

export default function Page() {
  // platform
  const [platform, setPlatform] = useState<PlatformKey>('etsy');

  // numeric model state
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);

  // read from URL once
  useEffect(() => {
    const url = new URL(window.location.href);
    const p = (url.searchParams.get(Q.platform) as PlatformKey) ?? platform;

    const readNum = (k: string, fallback: number) => {
      const raw = url.searchParams.get(k);
      if (raw == null) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };

    setPlatform((PLATFORMS as any).some((x: any) => x.key === p) ? p : 'etsy');

    setInputs({
      pr: readNum(Q.price, DEFAULT_INPUTS.pr),
      sc: readNum(Q.shipCharged, DEFAULT_INPUTS.sc),
      ss: readNum(Q.shipCost, DEFAULT_INPUTS.ss),
      cg: readNum(Q.cogs, DEFAULT_INPUTS.cg),
      tx: readNum(Q.tax, DEFAULT_INPUTS.tx),
      dc: readNum(Q.discountPct, DEFAULT_INPUTS.dc),
      tp: readNum(Q.targetProfit, DEFAULT_INPUTS.tp),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // write to URL on change (debounced-ish)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(Q.platform, platform);
    url.searchParams.set(Q.price, String(inputs.pr));
    url.searchParams.set(Q.shipCharged, String(inputs.sc));
    url.searchParams.set(Q.shipCost, String(inputs.ss));
    url.searchParams.set(Q.cogs, String(inputs.cg));
    url.searchParams.set(Q.tax, String(inputs.tx));
    url.searchParams.set(Q.discountPct, String(inputs.dc));
    url.searchParams.set(Q.targetProfit, String(inputs.tp));
    window.history.replaceState(null, '', url.toString());
  }, [platform, inputs]);

  // active rule
  const rule: FeeRule = RULES[platform];

  // core calcs
  const calc = useMemo(() => {
    const price = clamp(inputs.pr);
    const shipCharged = clamp(inputs.sc);
    const shipCost = clamp(inputs.ss);
    const cogs = clamp(inputs.cg);
    const tax = clamp(inputs.tx);
    const discountPct = Math.max(0, Math.min(100, inputs.dc)) / 100;

    const discountedPrice = price * (1 - discountPct);

    // Marketplace fee: % of discounted item price + ship charged + tax (AFTER discount)
    const marketplaceBase = discountedPrice + shipCharged + tax;
    const marketplaceFee = marketplaceBase * (rule.marketplacePct ?? 0);

    // Payment fee: pct of discounted price + optional fixed (if present)
    const paymentFee =
      (rule.paymentPct ?? 0) * discountedPrice + (rule.paymentFixed ?? 0);

    // Listing fee (fixed)
    const listingFee = rule.listingFee ?? 0;

    const totalFees = marketplaceFee + paymentFee + listingFee;

    const netProceeds =
      discountedPrice + shipCharged - totalFees - shipCost - cogs;

    const marginPct = (netProceeds / Math.max(1, discountedPrice)) * 100;

    return {
      discountedPrice,
      marketplaceFee,
      paymentFee,
      listingFee,
      totalFees,
      netProceeds,
      marginPct,
    };
  }, [inputs, rule]);

  // compare all platforms with current inputs
  const compareRows = useMemo(() => {
    const price = clamp(inputs.pr);
    const shipCharged = clamp(inputs.sc);
    const shipCost = clamp(inputs.ss);
    const cogs = clamp(inputs.cg);
    const tax = clamp(inputs.tx);
    const discountPct = Math.max(0, Math.min(100, inputs.dc)) / 100;

    const discountedPrice = price * (1 - discountPct);

    return PLATFORMS.map(({ key, label }) => {
      const r = RULES[key];
      const marketplaceBase = discountedPrice + shipCharged + tax;
      const marketplaceFee = marketplaceBase * (r.marketplacePct ?? 0);
      const paymentFee =
        (r.paymentPct ?? 0) * discountedPrice + (r.paymentFixed ?? 0);
      const listingFee = r.listingFee ?? 0;
      const totalFees = marketplaceFee + paymentFee + listingFee;
      const net = discountedPrice + shipCharged - totalFees - shipCost - cogs;
      const margin = (net / Math.max(1, discountedPrice)) * 100;

      return {
        key,
        label,
        profit: net,
        margin,
        marketplaceFee,
        paymentFee,
        listingFee,
        totalFees,
      };
    });
  }, [inputs]);

  /* ---------------- UI ---------------- */

  const Section: React.FC<{ title: string; children: any }> = ({
    title,
    children,
  }) => (
    <section className="rounded-2xl border-2 border-purple-500/40 ring-1 ring-inset ring-purple-500/30 bg-black/40 p-6">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">{title}</h2>
      {children}
    </section>
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => {
            // reset to defaults
            setPlatform('etsy');
            setInputs(DEFAULT_INPUTS);
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState(null, '', url.toString());
          }}
          title="Reset FeePilot to defaults"
        >
          <span className="h-3 w-3 rounded-full bg-purple-500 shadow-[0_0_12px_2px_rgba(168,85,247,0.7)]" />
          <h1 className="text-xl font-semibold">FeePilot</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-20">
        {/* Platform + timestamp */}
        <Section title="Platform">
          <div className="flex flex-col gap-2">
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
            <div className="text-sm text-neutral-400">
              Rules last updated: {RULES_UPDATED_AT}
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="Item price ($)"
              value={inputs.pr}
              onCommit={(n) => setInputs((s) => ({ ...s, pr: clamp(n, 0) }))}
            />
            <NumberField
              label="Shipping charged to buyer ($)"
              value={inputs.sc}
              onCommit={(n) => setInputs((s) => ({ ...s, sc: clamp(n, 0) }))}
            />
            <NumberField
              label="Your shipping cost ($)"
              value={inputs.ss}
              onCommit={(n) => setInputs((s) => ({ ...s, ss: clamp(n, 0) }))}
            />
            <NumberField
              label="Cost of goods ($)"
              value={inputs.cg}
              onCommit={(n) => setInputs((s) => ({ ...s, cg: clamp(n, 0) }))}
            />
            <NumberField
              label="Tax collected ($)"
              value={inputs.tx}
              onCommit={(n) => setInputs((s) => ({ ...s, tx: clamp(n, 0) }))}
            />
            <NumberField
              label="Discount (%)"
              value={inputs.dc}
              onCommit={(n) =>
                setInputs((s) => ({ ...s, dc: clamp(n, 0, 100) }))
              }
              step={1}
              hint="Percent off item price (applies before fees)"
            />
          </div>
        </Section>

        {/* Overview */}
        <Section title="Overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Profit</div>
              <div className={`mt-1 text-3xl font-semibold ${moneyClass(calc.netProceeds)}`}>
                {fmtMoney(calc.netProceeds)}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Margin</div>
              <div className={`mt-1 text-3xl font-semibold ${calc.netProceeds < 0 ? 'text-red-400' : 'text-neutral-100'}`}>
                {fmtPct(calc.marginPct)}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Marketplace fee</div>
              <div className="mt-1 text-2xl">{fmtMoney(calc.marketplaceFee)}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Payment fee</div>
              <div className="mt-1 text-2xl">{fmtMoney(calc.paymentFee)}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Listing fee</div>
              <div className="mt-1 text-2xl">{fmtMoney(calc.listingFee)}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">COGS</div>
              <div className="mt-1 text-2xl">{fmtMoney(inputs.cg)}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Shipping cost (your cost)</div>
              <div className="mt-1 text-2xl">{fmtMoney(inputs.ss)}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Total fees</div>
              <div className="mt-1 text-2xl">{fmtMoney(calc.totalFees)}</div>
            </div>
          </div>
        </Section>

        {/* Compare table */}
        <Section
          title={`Comparing with current inputs (${fmtMoney(inputs.pr)} price, ${fmtMoney(
            inputs.sc,
          )} ship charge, ${fmtMoney(inputs.ss)} ship cost, ${fmtMoney(
            inputs.cg,
          )} COGS, ${inputs.dc}% discount, ${fmtMoney(inputs.tx)} tax).`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead className="text-sm text-neutral-300">
                <tr>
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
                  <tr
                    key={row.key}
                    className={`rounded-xl bg-neutral-950/60 ${
                      row.key === platform ? 'outline outline-1 outline-purple-500/40' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setPlatform(row.key as PlatformKey)}
                        className="rounded-lg bg-neutral-900 px-3 py-1 text-sm hover:bg-neutral-800"
                      >
                        {row.label}
                      </button>
                    </td>
                    <td className={`px-3 py-3 font-medium ${moneyClass(row.profit)}`}>
                      {fmtMoney(row.profit)}
                    </td>
                    <td className="px-3 py-3">{fmtPct(row.margin)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.marketplaceFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.paymentFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.listingFee)}</td>
                    <td className="px-3 py-3">{fmtMoney(row.totalFees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Footer (component file you created) */}
        <Footer />
      </div>
    </main>
  );
}
