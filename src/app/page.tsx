/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import HeaderActions from './components/HeaderActions';
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
  return Math.max(min, Math.min(max, n));
}
function toNum(v: string | null, fallback = 0) {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const s = `$${abs.toFixed(2)}`;
  if (n < 0) return `(${s})`;
  return s;
}

/* -------- URL <-> state keys (short) ------- */
type InputState = {
  p: PlatformKey;
  pr: number; // item price
  sc: number; // shipping charged to buyer
  ss: number; // shipping cost (your cost)
  cg: number; // cogs
  tx: number; // tax charged to buyer
  dc: number; // discount (0..1)
  tp: number; // target profit
};

const DEFAULTS: InputState = {
  p: 'etsy',
  pr: 120,
  sc: 0,
  ss: 10,
  cg: 40,
  tx: 0,
  dc: 0,
  tp: 50,
};

/* ------------- small UI bits --------------- */
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-neutral-300 mb-1">{children}</div>;
}
function NumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      value={Number.isFinite(value) ? String(value) : ''}
      onChange={(e) => onChange(toNum(e.target.value, 0))}
      className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500 w-full"
      inputMode="decimal"
    />
  );
}
function Card({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/40 px-4 py-3">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${danger ? 'text-rose-400' : 'text-emerald-300'}`}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- main page ---------------- */

export default function Page() {
  // ---- state seeded from URL on first render
  const [inputs, setInputs] = useState<InputState>(() => {
    if (typeof window === 'undefined') return DEFAULTS;
    const sp = new URLSearchParams(window.location.search);
    return {
      p: (sp.get('p') as PlatformKey) || DEFAULTS.p,
      pr: toNum(sp.get('pr'), DEFAULTS.pr),
      sc: toNum(sp.get('sc'), DEFAULTS.sc),
      ss: toNum(sp.get('ss'), DEFAULTS.ss),
      cg: toNum(sp.get('cg'), DEFAULTS.cg),
      tx: toNum(sp.get('tx'), DEFAULTS.tx),
      dc: toNum(sp.get('dc'), DEFAULTS.dc),
      tp: toNum(sp.get('tp'), DEFAULTS.tp),
    };
  });

  // ---- push state to URL (short keys)
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('p', inputs.p);
    sp.set('pr', String(inputs.pr));
    sp.set('sc', String(inputs.sc));
    sp.set('ss', String(inputs.ss));
    sp.set('cg', String(inputs.cg));
    sp.set('tx', String(inputs.tx));
    sp.set('dc', String(inputs.dc));
    sp.set('tp', String(inputs.tp));
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', url);
  }, [inputs]);

  const rule: FeeRule = RULES[inputs.p];

  /* ---------- core calculations ---------- */

  // discounted price after % discount
  const discountedPrice = useMemo(() => clamp(inputs.pr * (1 - clamp(inputs.dc, 0, 1))), [inputs.pr, inputs.dc]);

  // marketplace fee base: discounted price + shipping charged + tax
  const marketplaceBase = useMemo(
    () => clamp(discountedPrice + clamp(inputs.sc) + clamp(inputs.tx)),
    [discountedPrice, inputs.sc, inputs.tx]
  );

  const marketplaceFee = useMemo(
    () => clamp(marketplaceBase * (rule.marketplacePct ?? 0)),
    [marketplaceBase, rule]
  );

  // payment fee: % of discounted price + fixed
  const paymentFee = useMemo(
    () => clamp(discountedPrice * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0)),
    [discountedPrice, rule]
  );

  // listing fee: usually fixed per listing
  const listingFee = clamp(rule.listingFee ?? 0);

  // fees (platform fees only)
  const totalPlatformFees = useMemo(
    () => clamp(marketplaceFee + paymentFee + listingFee),
    [marketplaceFee, paymentFee, listingFee]
  );

  // buyer subtotal used for margin/profit baseline (what buyer pays that we collect)
  const buyerSubtotal = useMemo(
    () => clamp(discountedPrice + clamp(inputs.sc) + clamp(inputs.tx)),
    [discountedPrice, inputs.sc, inputs.tx]
  );

  // profit = buyer subtotal - platform fees - shipping cost (your cost) - cogs
  const profit = useMemo(
    () => clamp(buyerSubtotal - totalPlatformFees - clamp(inputs.ss) - clamp(inputs.cg)),
    [buyerSubtotal, totalPlatformFees, inputs.ss, inputs.cg]
  );

  const margin = useMemo(() => {
    const base = buyerSubtotal || 1;
    return clamp(profit / base, -10, 10);
  }, [profit, buyerSubtotal]);

  // compare table rows (same inputs across platforms)
  const compareRows = useMemo(() => {
    return PLATFORMS.map(({ key, label }) => {
      const r = RULES[key];
      const disc = clamp(inputs.pr * (1 - clamp(inputs.dc, 0, 1)));
      const base = clamp(disc + clamp(inputs.sc) + clamp(inputs.tx));
      const mp = clamp(base * (r.marketplacePct ?? 0));
      const pay = clamp(disc * (r.paymentPct ?? 0) + (r.paymentFixed ?? 0));
      const list = clamp(r.listingFee ?? 0);
      const fees = clamp(mp + pay + list);
      const prof = clamp(base - fees - clamp(inputs.ss) - clamp(inputs.cg));
      const mrg = clamp(prof / (base || 1), -10, 10);

      return {
        key,
        label,
        profit: prof,
        margin: mrg,
        marketplaceFee: mp,
        paymentFee: pay,
        listingFee: list,
        totalFees: fees,
      };
    });
  }, [inputs]);

  // header reset
  const resetAll = () => setInputs(DEFAULTS);

  /* ----------------- UI ------------------- */

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-900/80 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={resetAll}
            className="group inline-flex items-center gap-2"
            title="Reset inputs"
          >
            <span className="h-3 w-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20 group-hover:ring-purple-500/40 transition" />
            <span className="font-semibold">FeePilot</span>
          </button>

          {/* actions (Share / Copy / Pro) */}
          <HeaderActions />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* Platform card */}
        <section className="mt-6 rounded-3xl border border-purple-500/30 bg-neutral-950/40 p-4">
          <div className="text-neutral-400 text-sm mb-2">Platform</div>
          <select
            value={inputs.p}
            onChange={(e) => setInputs((s) => ({ ...s, p: e.target.value as PlatformKey }))}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="mt-2 text-sm text-neutral-400">
            Rules last updated:{' '}
            <span className="font-mono">{RULES_UPDATED_AT}</span>
          </div>
        </section>

        {/* Inputs */}
        <section className="mt-6 grid gap-4 rounded-3xl border border-purple-500/30 bg-neutral-950/40 p-4 md:grid-cols-2">
          <div>
            <Label>Item price ($)</Label>
            <NumberInput value={inputs.pr} onChange={(n) => setInputs((s) => ({ ...s, pr: n }))} />
          </div>
          <div>
            <Label>Shipping charged to buyer ($)</Label>
            <NumberInput value={inputs.sc} onChange={(n) => setInputs((s) => ({ ...s, sc: n }))} />
          </div>
          <div>
            <Label>Your shipping cost ($)</Label>
            <NumberInput value={inputs.ss} onChange={(n) => setInputs((s) => ({ ...s, ss: n }))} />
          </div>
          <div>
            <Label>COGS ($)</Label>
            <NumberInput value={inputs.cg} onChange={(n) => setInputs((s) => ({ ...s, cg: n }))} />
          </div>
          <div>
            <Label>Tax collected ($)</Label>
            <NumberInput value={inputs.tx} onChange={(n) => setInputs((s) => ({ ...s, tx: n }))} />
          </div>
          <div>
            <Label>Discount (%)</Label>
            <NumberInput
              value={inputs.dc}
              onChange={(n) => setInputs((s) => ({ ...s, dc: n }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Target profit ($)</Label>
            <NumberInput value={inputs.tp} onChange={(n) => setInputs((s) => ({ ...s, tp: n }))} />
          </div>
        </section>

        {/* Overview */}
        <section className="mt-6 grid gap-4 rounded-3xl border border-purple-500/30 bg-neutral-950/40 p-4 md:grid-cols-2">
          <Card title="Profit" value={fmtMoney(profit)} danger={profit < 0} />
          <Card title="Margin" value={pct(margin)} danger={margin < 0} />

          <Card title="Marketplace fee" value={fmtMoney(marketplaceFee)} danger={false} />
          <Card title="Payment fee" value={fmtMoney(paymentFee)} danger={false} />
          <Card title="Listing fee" value={fmtMoney(listingFee)} danger={false} />
          <Card title="Shipping cost (your cost)" value={fmtMoney(inputs.ss)} danger={false} />
          <Card title="COGS" value={fmtMoney(inputs.cg)} danger={false} />
          <Card title="Total fees" value={fmtMoney(totalPlatformFees)} danger={false} />
        </section>

        {/* Compare table */}
        <section className="mt-6 rounded-3xl border border-purple-500/30 bg-neutral-950/40 p-4">
          <div className="mb-3 text-neutral-300">
            Comparing with current inputs (
            <span className="font-semibold">{fmtMoney(inputs.pr)}</span> price,{' '}
            <span className="font-semibold">{fmtMoney(inputs.sc)}</span> ship charge,{' '}
            <span className="font-semibold">{fmtMoney(inputs.ss)}</span> ship cost,{' '}
            <span className="font-semibold">{fmtMoney(inputs.cg)}</span> COGS,{' '}
            <span className="font-semibold">{pct(inputs.dc)}</span> discount,{' '}
            <span className="font-semibold">{fmtMoney(inputs.tx)}</span> tax).
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-400">
                <tr className="border-b border-neutral-900">
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
                  <tr key={row.key} className="border-b border-neutral-900/70">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setInputs((s) => ({ ...s, p: row.key }))}
                        className="rounded-lg bg-neutral-900 px-2 py-1 hover:bg-neutral-800"
                      >
                        {PLATFORMS.find((p) => p.key === row.key)?.label ?? row.key}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-emerald-300">
                      <span className={row.profit < 0 ? 'text-rose-400' : 'text-emerald-300'}>
                        {fmtMoney(row.profit)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className={row.margin < 0 ? 'text-rose-400' : 'text-neutral-300'}>
                        {pct(row.margin)}
                      </div>
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
        <div className="mt-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}
