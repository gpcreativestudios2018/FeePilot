'use client';

import React, { useMemo, useState, useEffect } from 'react';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';
import ResetButton from './components/ResetButton';
import ThemeToggle from './components/ThemeToggle';
import ClearSavedDataButton from './components/ClearSavedDataButton';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

import { cx, formatMoneyWithParens } from '../lib/format';
import ComparisonTableSection from './components/ComparisonTableSection';

/* ---------------------------------- types --------------------------------- */
type Inputs = {
  platform: PlatformKey;
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  discountPct: number;
  tax: number;
};

/* ------------------------------ utilities --------------------------------- */
const parseNum = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  Math.min(max, Math.max(min, n));
const pct = (n: number) => n / 100;

const getListingFixed = (rule: FeeRule): number => {
  const anyRule = rule as unknown as { listingFixed?: number };
  return anyRule.listingFixed ?? 0;
};

function calcFor(rule: FeeRule, inputs: Inputs) {
  const discounted = clamp(inputs.price * (1 - pct(inputs.discountPct)));
  const base = discounted + inputs.shipCharge;

  const marketplaceFee =
    clamp(base * pct(rule.marketplacePct ?? 0)) + (rule.marketplaceFixed ?? 0);
  const paymentFee =
    clamp(base * pct(rule.paymentPct ?? 0)) + (rule.paymentFixed ?? 0);
  const listingFee = getListingFixed(rule);

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const net =
    discounted +
    inputs.shipCharge -
    totalFees -
    inputs.shipCost -
    inputs.cogs -
    inputs.tax;

  const profit = net;
  const marginPct = discounted > 0 ? (profit / discounted) * 100 : 0;

  return { discounted, marketplaceFee, paymentFee, listingFee, totalFees, net, profit, marginPct };
}

/* ----------------------------- share/copy --------------------------------- */
const shareLink = async (): Promise<void> => {
  const url = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title: 'FeePilot', url }); } catch {}
  } else {
    await navigator.clipboard.writeText(url);
  }
};
const copyLink = async (): Promise<void> => {
  const url = window.location.href;
  await navigator.clipboard.writeText(url);
};

function makeDefaults(): Inputs {
  return {
    platform: PLATFORMS[0] ?? ('mercari' as PlatformKey),
    price: 100,
    shipCharge: 0,
    shipCost: 10,
    cogs: 40,
    discountPct: 0,
    tax: 0,
  };
}

/* ------------------------- PERSISTENCE KEYS -------------------------------- */
const THEME_KEY = 'feepilot:theme';          // 'light' | 'dark'
const INPUTS_KEY = 'feepilot:inputs:v1';     // JSON of Inputs

/* ----------------------------------- UI ----------------------------------- */
export default function Page() {
  // Read saved inputs synchronously (prevents “reset on refresh”)
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (typeof window === 'undefined') return makeDefaults();
    try {
      const raw = window.localStorage.getItem(INPUTS_KEY);
      if (!raw) return makeDefaults();
      const p = JSON.parse(raw) as Partial<Inputs>;
      const d = makeDefaults();
      return {
        platform: (p.platform && PLATFORMS.includes(p.platform as PlatformKey))
          ? (p.platform as PlatformKey) : d.platform,
        price: Number.isFinite(p.price) ? (p.price as number) : d.price,
        shipCharge: Number.isFinite(p.shipCharge) ? (p.shipCharge as number) : d.shipCharge,
        shipCost: Number.isFinite(p.shipCost) ? (p.shipCost as number) : d.shipCost,
        cogs: Number.isFinite(p.cogs) ? (p.cogs as number) : d.cogs,
        discountPct: Number.isFinite(p.discountPct) ? (p.discountPct as number) : d.discountPct,
        tax: Number.isFinite(p.tax) ? (p.tax as number) : d.tax,
      };
    } catch {
      return makeDefaults();
    }
  });

  // Theme with synchronous init, too
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(THEME_KEY) === 'light';
    } catch {
      return false;
    }
  });
  const toggleTheme = () => setIsLight((v) => !v);

  // Save inputs on any change
  useEffect(() => {
    try {
      window.localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  // Save theme on change
  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    } catch {}
  }, [isLight]);

  const resetInputs = () => {
    const next = makeDefaults();
    setInputs(next);
    try { window.localStorage.removeItem(INPUTS_KEY); } catch {}
  };

  const rule = RULES[inputs.platform];
  const current = useMemo(() => calcFor(rule, inputs), [rule, inputs]);

  // theme helpers
  const pageBgText = isLight ? 'bg-white text-black' : 'bg-black text-white';
  const subtleText = isLight ? 'text-gray-700' : 'text-gray-300';
  const selectOption = isLight ? 'bg-white text-black' : 'bg-black text-white';
  const panelBorder = isLight ? 'border-purple-800/70' : 'border-purple-600/40';
  const controlBorder = isLight ? 'border-purple-800/70' : 'border-purple-600/50';

  // unified pill style (matches other header buttons)
  const pillButton = cx(
    'rounded-full px-4 py-2 text-base select-none border',
    isLight
      ? 'border-purple-800/70 text-black hover:bg-purple-50'
      : 'border-purple-600/50 text-white hover:bg-white/5'
  );

  return (
    <div className={cx('min-h-dvh', pageBgText)}>
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            {/* accent dot */}
            <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-purple-500 ring-2 ring-purple-400/50" />
            FeePilot
          </h1>

          <div className="flex items-center gap-3">
            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            <ResetButton onClick={resetInputs} />

            {/* HeaderActions renders Share / Copy / Pro */}
            <HeaderActions onShare={shareLink} onCopy={copyLink} />

            {/* Dev-only: place AFTER Pro (far right), styled like other pills */}
            {process.env.NODE_ENV !== 'production' && (
              <ClearSavedDataButton
                keys={[THEME_KEY, INPUTS_KEY]}
                className={pillButton}
                onCleared={() => {
                  setInputs(makeDefaults());
                  setIsLight(false);
                }}
              >
                Clear saved data
              </ClearSavedDataButton>
            )}
          </div>
        </div>

        <div
          className={cx(
            'mt-3 inline-flex rounded-full border px-3 py-1 text-sm',
            controlBorder,
            isLight ? 'text-purple-700' : 'text-purple-200'
          )}
        >
          Rules last updated: {RULES_UPDATED_AT}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* Inputs */}
        <section className={cx('rounded-2xl border p-4 sm:p-6', panelBorder)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Platform</label>
              <select
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.platform}
                onChange={(e) => setInputs((s) => ({ ...s, platform: e.target.value as PlatformKey }))}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className={selectOption}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Item price ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.price}
                onChange={(e) => setInputs((s) => ({ ...s, price: clamp(parseNum(e.target.value), 0) }))}
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Discount (%)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.discountPct}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, discountPct: clamp(parseNum(e.target.value), 0, 100) }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Shipping charged to buyer ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.shipCharge}
                onChange={(e) => setInputs((s) => ({ ...s, shipCharge: clamp(parseNum(e.target.value), 0) }))}
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Your shipping cost ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.shipCost}
                onChange={(e) => setInputs((s) => ({ ...s, shipCost: clamp(parseNum(e.target.value), 0) }))}
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>COGS ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.cogs}
                onChange={(e) => setInputs((s) => ({ ...s, cogs: clamp(parseNum(e.target.value), 0) }))}
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>Tax collected ($)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx('w-full rounded-xl border bg-transparent px-3 py-2 outline-none', controlBorder)}
                value={inputs.tax}
                onChange={(e) => setInputs((s) => ({ ...s, tax: clamp(parseNum(e.target.value), 0) }))}
              />
            </div>
          </div>
        </section>

        {/* Cards – ALL 8 */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Discounted price</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.discounted)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Marketplace fee</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.marketplaceFee)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Payment fee</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.paymentFee)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Listing fee</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.listingFee)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Total fees</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.totalFees)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Estimated payout</div>
            <div className="mt-2 text-3xl font-semibold">{formatMoneyWithParens(current.net)}</div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Profit</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold',
                current.profit < 0 ? 'text-red-500' : isLight ? 'text-emerald-700' : 'text-emerald-300'
              )}
            >
              {formatMoneyWithParens(current.profit)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Margin</div>
            <div className={cx('mt-2 text-3xl font-semibold', current.marginPct < 0 && 'text-red-500')}>
              {current.marginPct.toFixed(1)}%
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <ComparisonTableSection
          className={cx('mt-10', 'border', panelBorder, 'rounded-2xl')}
          isLight={isLight}
          inputs={{
            price: inputs.price,
            shipCharge: inputs.shipCharge,
            shipCost: inputs.shipCost,
            cogs: inputs.cogs,
            discountPct: inputs.discountPct,
            tax: inputs.tax,
          }}
          comparison={PLATFORMS.map((p) => {
            const r = RULES[p];
            const c = calcFor(r, inputs);
            return {
              platform: p,
              profit: c.profit,
              marginPct: c.marginPct,
              marketplaceFee: c.marketplaceFee,
              paymentFee: c.paymentFee,
              listingFee: c.listingFee,
              totalFees: c.totalFees,
            };
          })}
        />

        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}
