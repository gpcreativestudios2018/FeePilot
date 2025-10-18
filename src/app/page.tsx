'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  PlatformKey,
  FeeRule,
} from '@/data/fees';

/* ---------------- defaults + helpers ---------------- */

const DEFAULT_PLATFORM: PlatformKey = 'etsy';
const DEFAULTS = {
  p: 120,
  sc: 0,
  ss: 10,
  cg: 40,
  tx: 0,
  dc: 0,
};

type Inputs = {
  p: number; // price
  sc: number; // ship charge to buyer
  ss: number; // ship cost (seller)
  cg: number; // cogs
  tx: number; // tax %
  dc: number; // discount %
};

function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}
function parseLooseNumber(s: string): number {
  if (s.trim() === '') return 0;
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`;
}
function fmtMoneyWithParens(n: number) {
  return n < 0 ? `(${fmtMoney(Math.abs(n))})` : fmtMoney(n);
}
function cx(...list: (string | false | null | undefined)[]) {
  return list.filter(Boolean).join(' ');
}

/* purple frame */
const sectionFrame =
  'rounded-2xl border border-purple-500/40 bg-neutral-950/55 shadow-[0_0_0_1px_rgba(168,85,247,.3)_inset,0_0_26px_rgba(168,85,247,.08)]';

/* ---------------- fee engine ---------------- */

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

  const listingFee = rule.listingFee ?? 0;

  const discountedPrice = price * (1 - discountPct);
  const marketplaceBase = discountedPrice + shipCharged + discountedPrice * taxPct;

  const marketplaceFee = marketplaceBase * (rule.marketplacePct ?? 0);
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

/* -------------- URL build (short + omit defaults) -------------- */

function buildShortURL(
  baseHref: string,
  platform: PlatformKey,
  inputs: Inputs
): string {
  const url = new URL(baseHref);
  const q = url.searchParams;
  q.delete('pf');
  q.delete('p');
  q.delete('sc');
  q.delete('ss');
  q.delete('cg');
  q.delete('tx');
  q.delete('dc');

  if (platform !== DEFAULT_PLATFORM) q.set('pf', platform);

  (Object.keys(DEFAULTS) as (keyof Inputs)[]).forEach((key) => {
    const def = DEFAULTS[key];
    const v = inputs[key];
    if (v !== def) q.set(key, String(v));
  });

  return url.toString();
}

/* -------------- NumberField: local text state -------------- */

function NumberField({
  label,
  value,
  onCommit,
  suffix,
}: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  suffix?: string;
}) {
  const [text, setText] = useState<string>(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(String(value));
  }, [value]);

  const commit = () => {
    const n = clamp(parseLooseNumber(text));
    onCommit(n);
    setText(String(n));
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-neutral-300">{label}</span>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => (focusedRef.current = true)}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
        inputMode="decimal"
      />
      {suffix ? (
        <span className="text-xs text-neutral-500 -mt-1">{suffix}</span>
      ) : null}
    </div>
  );
}

/* ---------------- page ---------------- */

export default function Page() {
  const [platform, setPlatform] = useState<PlatformKey>(DEFAULT_PLATFORM);
  const [inputs, setInputs] = useState<Inputs>({ ...DEFAULTS });
  const activeInputsRef = useRef(0);
  const isTyping = activeInputsRef.current > 0;

  // Header feedback for copy/share
  const [copied, setCopied] = useState(false);

  // count focused inputs (avoid URL churn while typing)
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement) activeInputsRef.current += 1;
    };
    const onBlur = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement)
        activeInputsRef.current = Math.max(0, activeInputsRef.current - 1);
    };
    window.addEventListener('focusin', onFocus);
    window.addEventListener('focusout', onBlur);
    return () => {
      window.removeEventListener('focusin', onFocus);
      window.removeEventListener('focusout', onBlur);
    };
  }, []);

  // Hydrate once from short URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams;
    const get = (key: keyof Inputs, def: number) =>
      clamp(parseLooseNumber(q.get(key) ?? String(def)));

    const next: Inputs = {
      p: get('p', DEFAULTS.p),
      sc: get('sc', DEFAULTS.sc),
      ss: get('ss', DEFAULTS.ss),
      cg: get('cg', DEFAULTS.cg),
      tx: get('tx', DEFAULTS.tx),
      dc: get('dc', DEFAULTS.dc),
    };
    setInputs(next);

    const pf = (q.get('pf') as PlatformKey | null) || DEFAULT_PLATFORM;
    if (RULES[pf]) setPlatform(pf);
  }, []);

  // Short URL sync (omit defaults)
  useEffect(() => {
    if (isTyping) return;
    const t = window.setTimeout(() => {
      const shortURL = buildShortURL(window.location.href, platform, inputs);
      window.history.replaceState({}, '', shortURL);
    }, 300);
    return () => window.clearTimeout(t);
  }, [inputs, platform, isTyping]);

  // calculate
  const current = useMemo(
    () => computeForPlatform(platform, inputs),
    [platform, inputs]
  );
  const compareRows = useMemo(
    () => PLATFORMS.map((p) => computeForPlatform(p.key, inputs)),
    [inputs]
  );

  // actions
  const resetAll = () => {
    setPlatform(DEFAULT_PLATFORM);
    setInputs({ ...DEFAULTS });
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  };

  const getShareURL = () => buildShortURL(window.location.href, platform, inputs);

  const doCopy = async () => {
    const url = getShareURL();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const doShare = async () => {
    const url = getShareURL();
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ url, title: 'FeePilot' });
      } catch {
        // ignore
      }
    } else {
      await doCopy();
      alert('Link copied to clipboard.');
    }
  };

  /* ---------------- render ---------------- */

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-neutral-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={resetAll}
          className="group flex items-center gap-3"
          title="Reset to defaults"
        >
          <div className="h-3 w-3 rounded-full bg-purple-500 group-hover:scale-110 transition-transform" />
          <h1 className="text-2xl font-semibold group-hover:text-purple-300 transition-colors">
            FeePilot
          </h1>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={doShare}
            className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-sm hover:border-purple-500"
            title="Share"
          >
            Share
          </button>
          <button
            onClick={doCopy}
            className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-sm hover:border-purple-500"
            title="Copy link"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a
            href="/pro"
            className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-sm hover:border-purple-500"
            title="Pro"
          >
            Pro
          </a>
        </div>
      </div>

      {/* Platform */}
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
          Rules last updated:{' '}
          <span className="tabular-nums">{RULES_UPDATED_AT}</span>
        </div>
      </section>

      {/* Inputs */}
      <section className={cx('mb-8 p-5', sectionFrame)}>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            label="Item price ($)"
            value={inputs.p}
            onCommit={(n) => setInputs((s) => ({ ...s, p: n }))}
          />
          <NumberField
            label="Shipping charged to buyer ($)"
            value={inputs.sc}
            onCommit={(n) => setInputs((s) => ({ ...s, sc: n }))}
          />
          <NumberField
            label="Your shipping cost ($)"
            value={inputs.ss}
            onCommit={(n) => setInputs((s) => ({ ...s, ss: n }))}
          />
          <NumberField
            label="Cost of goods ($)"
            value={inputs.cg}
            onCommit={(n) => setInputs((s) => ({ ...s, cg: n }))}
          />
          <NumberField
            label="Tax collected (%)"
            value={inputs.tx}
            onCommit={(n) => setInputs((s) => ({ ...s, tx: n }))}
          />
          <NumberField
            label="Discount (%)"
            value={inputs.dc}
            onCommit={(n) => setInputs((s) => ({ ...s, dc: n }))}
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
            <div className="mt-2 text-2xl tabular-nums">
              {fmtMoney(inputs.cg)}
            </div>
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
