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
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function toNumberLike(v: string | number) {
  const n = typeof v === 'number' ? v : parseFloat((v || '0').toString());
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`;
}
function fmtMoneyWithParens(n: number) {
  return n < 0 ? `(${fmtMoney(Math.abs(n))})` : fmtMoney(n);
}

/** join classes */
function cx(...list: (string | false | null | undefined)[]) {
  return list.filter(Boolean).join(' ');
}

/* -------- shared styles (purple frames) -------- */

const sectionFrame =
  'rounded-2xl border border-purple-500/30 bg-neutral-950/50 shadow-[0_0_0_1px_rgba(168,85,247,.25)_inset,0_0_24px_rgba(168,85,247,.06)]';

/* ---------------- fee engine ---------------- */

type Inputs = {
  p: number; // price
  sc: number; // ship charge to buyer
  ss: number; // ship cost (seller)
  cg: number; // cogs
  tx: number; // tax %
  dc: number; // discount %
};

type Row = {
  key: PlatformKey;
  profit: number;
  margin: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  totalFees: number;
};

function computeForPlatform(platform: PlatformKey, inputs: Inputs): Row {
  const rule: FeeRule = RULES[platform];

  const price = clamp(inputs.p);
  const shipCharged = clamp(inputs.sc);
  const shipCost = clamp(inputs.ss);
  const cogs = clamp(inputs.cg);
  const taxPct = clamp(inputs.tx) / 100;
  const discountPct = clamp(inputs.dc) / 100;

  // Listing fee (fixed amount)
  const listingFee = rule.listingFee ?? 0;

  // Marketplace base is AFTER discount + ship charged + tax on item
  const discountedPrice = price * (1 - discountPct);
  const marketplaceBase = discountedPrice + shipCharged + discountedPrice * taxPct;

  // NOTE: Your FeeRule does NOT have marketplaceFixed, so we only use percentage.
  const marketplaceFee = marketplaceBase * (rule.marketplacePct ?? 0);

  // Payment fee: many platforms have a fixed component; keep paymentFixed if present
  const paymentFee =
    discountedPrice * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0);

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const profit = price + shipCharged - shipCost - cogs - totalFees;
  const marginBase = price + shipCharged;
  const margin = marginBase > 0 ? (profit / marginBase) * 100 : 0;

  return {
    key: platform,
    profit,
    margin,
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
  };
}

/* ---------------- page ---------------- */

export default function Page() {
  // URL state (short keys)
  const [platform, setPlatform] = useState<PlatformKey>('etsy');
  const [inputs, setInputs] = useState<Inputs>({
    p: 120,
    sc: 0,
    ss: 10,
    cg: 40,
    tx: 0,
    dc: 0,
  });

  // hydrate from URL once
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams;

    const p = toNumberLike(q.get('p') ?? inputs.p);
    const sc = toNumberLike(q.get('sc') ?? inputs.sc);
    const ss = toNumberLike(q.get('ss') ?? inputs.ss);
    const cg = toNumberLike(q.get('cg') ?? inputs.cg);
    const tx = toNumberLike(q.get('tx') ?? inputs.tx);
    const dc = toNumberLike(q.get('dc') ?? inputs.dc);

    const pf = (q.get('pf') as PlatformKey) || (q.get('p') as PlatformKey);
    if (pf && RULES[pf]) setPlatform(pf);

    setInputs({ p, sc, ss, cg, tx, dc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // write URL on changes
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams;

    q.set('p', String(inputs.p));
    q.set('sc', String(inputs.sc));
    q.set('ss', String(inputs.ss));
    q.set('cg', String(inputs.cg));
    q.set('tx', String(inputs.tx));
    q.set('dc', String(inputs.dc));
    q.set('pf', platform);

    const next = url.toString();
    window.history.replaceState({}, '', next);
  }, [inputs, platform]);

  const current = useMemo(
    () => computeForPlatform(platform, inputs),
    [platform, inputs]
  );

  const compareRows = useMemo(() => {
    return PLATFORMS.map((p) => computeForPlatform(p.key, inputs));
  }, [inputs]);

  /* ---------- UI field component ---------- */

  function NumberField({
    label,
    value,
    onChange,
    suffix,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    suffix?: string;
  }) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-neutral-300">{label}</span>
        <input
          value={String(value)}
          onChange={(e) => onChange(toNumberLike(e.target.value))}
          className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
          inputMode="decimal"
        />
        {suffix ? (
          <span className="text-xs text-neutral-500 -mt-1">{suffix}</span>
        ) : null}
      </div>
    );
  }

  /* ---------------- render ---------------- */

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-neutral-100">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-purple-500" />
        <h1 className="text-2xl font-semibold">FeePilot</h1>
      </div>

      {/* Platform + last updated */}
      <section className={cx('mb-8 p-5', sectionFrame)}>
        <div className="mb-4 text-sm text-neutral-300">Platform</div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as PlatformKey)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500 md:w-96"
        >
          {PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="mt-3 text-sm text-neutral-400">
          Rules last updated: <span className="tabular-nums">{RULES_UPDATED_AT}</span>
        </div>
      </section>

      {/* Inputs */}
      <section className={cx('mb-8 p-5', sectionFrame)}>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            label="Item price ($)"
            value={inputs.p}
            onChange={(n) => setInputs((s) => ({ ...s, p: n }))}
          />
          <NumberField
            label="Shipping charged to buyer ($)"
            value={inputs.sc}
            onChange={(n) => setInputs((s) => ({ ...s, sc: n }))}
          />
          <NumberField
            label="Your shipping cost ($)"
            value={inputs.ss}
            onChange={(n) => setInputs((s) => ({ ...s, ss: n }))}
          />
          <NumberField
            label="Cost of goods ($)"
            value={inputs.cg}
            onChange={(n) => setInputs((s) => ({ ...s, cg: n }))}
          />
          <NumberField
            label="Tax collected (%)"
            value={inputs.tx}
            onChange={(n) => setInputs((s) => ({ ...s, tx: n }))}
            suffix="Rate applied to item price, not shipping"
          />
          <NumberField
            label="Discount (%)"
            value={inputs.dc}
            onChange={(n) => setInputs((s) => ({ ...s, dc: n }))}
            suffix="Platform or coupon discount on item price"
          />
        </div>
      </section>

      {/* Overview */}
      <section className={cx('mb-8 p-5', sectionFrame)}>
        <h2 className="mb-4 text-xl font-semibold">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profit */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Profit</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold tabular-nums',
                current.profit < 0 ? 'text-red-400' : 'text-green-400'
              )}
            >
              {fmtMoneyWithParens(current.profit)}
            </div>
          </div>

          {/* Margin */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Margin</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {current.margin.toFixed(1)}%
            </div>
          </div>

          {/* Marketplace fee */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Marketplace fee</div>
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(current.marketplaceFee)}
            </div>
          </div>

          {/* Payment fee */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Payment fee</div>
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(current.paymentFee)}
            </div>
          </div>

          {/* Listing fee */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Listing fee</div>
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(current.listingFee)}
            </div>
          </div>

          {/* Shipping cost (your cost) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Shipping cost (your cost)</div>
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(inputs.ss)}
            </div>
          </div>

          {/* COGS */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">COGS</div>
            <div className="mt-2 text-2xl tabular-nums">{fmtMoney(inputs.cg)}</div>
          </div>

          {/* Total fees */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-sm text-neutral-400">Total fees</div>
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(current.totalFees)}
            </div>
          </div>
        </div>
      </section>

      {/* Compare table */}
      <section className={cx('mb-10 p-5', sectionFrame)}>
        <div className="mb-4 text-neutral-300">
          Comparing with current inputs (
          <span className="font-semibold tabular-nums">
            {fmtMoney(inputs.p)}
          </span>{' '}
          price,{' '}
          <span className="font-semibold tabular-nums">
            {fmtMoney(inputs.sc)}
          </span>{' '}
          ship charge,{' '}
          <span className="font-semibold tabular-nums">
            {fmtMoney(inputs.ss)}
          </span>{' '}
          ship cost,{' '}
          <span className="font-semibold tabular-nums">
            {fmtMoney(inputs.cg)}
          </span>{' '}
          COGS,{' '}
          <span className="font-semibold tabular-nums">
            {inputs.dc.toFixed(0)}%
          </span>{' '}
          discount,{' '}
          <span className="font-semibold tabular-nums">
            {inputs.tx.toFixed(0)}%
          </span>{' '}
          tax).
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-neutral-300">
                <th className="px-3 py-2 text-left">Platform</th>
                <th className="px-3 py-2 text-right">Profit</th>
                <th className="px-3 py-2 text-right">Margin</th>
                <th className="px-3 py-2 text-right">Marketplace fee</th>
                <th className="px-3 py-2 text-right">Payment fee</th>
                <th className="px-3 py-2 text-right">Listing fee</th>
                <th className="px-3 py-2 text-right">Total fees</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-t border-neutral-800/70 hover:bg-neutral-900/30"
                >
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-neutral-900/70 px-3 py-1 text-neutral-200">
                      {PLATFORMS.find((p) => p.key === row.key)?.label ?? row.key}
                    </span>
                  </td>

                  {/* Profit with red negatives + parentheses, green positives */}
                  <td
                    className={cx(
                      'px-3 py-2 text-right tabular-nums',
                      row.profit < 0 ? 'text-red-400' : 'text-green-400'
                    )}
                  >
                    {fmtMoneyWithParens(row.profit)}
                  </td>

                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.margin.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(row.marketplaceFee)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(row.paymentFee)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(row.listingFee)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(row.totalFees)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-neutral-500">
        Made by <span className="text-purple-400">FeePilot</span>. Sporty Neon theme.
      </footer>
    </main>
  );
}
