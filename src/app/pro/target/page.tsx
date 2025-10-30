'use client';

import React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PILL_CLASS } from '@/lib/ui';
import {
  PLATFORMS,
  RULES,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';
import SolvingForPill from './SolvingForPill';

// ------- Inline presets helpers (avoid '@/lib/presets' import) -------
type TargetPreset = {
  platform: string;
  targetProfit: string;
  targetMarginPct: string;
  cogs: string;
  shipCost: string;
  discountPct: string;
  shipCharge: string;
};
type NamedTargetPreset = { name: string; updatedAt: number; data: TargetPreset };

const PRESET_NS = 'feepilot:target-presets';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function readAll(): NamedTargetPreset[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PRESET_NS);
  const arr = safeParse<NamedTargetPreset[]>(raw);
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((it) => it && typeof it.name === 'string' && typeof it.updatedAt === 'number' && it.data)
    .slice(0, 200);
}
function writeAll(list: NamedTargetPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRESET_NS, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
function listPresets(): NamedTargetPreset[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}
function savePreset(name: string, data: TargetPreset): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const all = readAll();
  const idx = all.findIndex((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const item: NamedTargetPreset = { name: trimmed, updatedAt: Date.now(), data };
  if (idx >= 0) all[idx] = item; else all.push(item);
  writeAll(all);
}
function loadPreset(name: string): TargetPreset | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const found = readAll().find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  return found ? found.data : null;
}
function deletePreset(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  writeAll(readAll().filter((p) => p.name.toLowerCase() !== trimmed.toLowerCase()));
}
function clearAllPresets(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRESET_NS);
}
// --------------------------------------------------------------------

// --- helpers (mirror main calculator math) ---
const pct = (n: number) => n / 100;
const clamp = (n: number, min = 0, max = 1_000_000) => Math.min(max, Math.max(min, n));
const parseNum = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getListingFixed = (rule: FeeRule): number => {
  const anyRule = rule as unknown as { listingFixed?: number };
  return anyRule.listingFixed ?? 0;
};

function computeAtPrice(opts: {
  rule: FeeRule;
  price: number;
  discountPct: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
}) {
  const { rule, price, discountPct, shipCharge, shipCost, cogs } = opts;
  const discounted = clamp(price * (1 - pct(discountPct)), 0);
  const base = discounted + shipCharge;

  const marketplaceFee =
    clamp(base * pct(rule.marketplacePct ?? 0)) + (rule.marketplaceFixed ?? 0);
  const paymentFee =
    clamp(base * pct(rule.paymentPct ?? 0)) + (rule.paymentFixed ?? 0);
  const listingFee = getListingFixed(rule);

  const totalFees = marketplaceFee + paymentFee + listingFee;

  const profit = discounted + shipCharge - totalFees - shipCost - cogs;
  const marginPct = discounted > 0 ? (profit / discounted) * 100 : 0;

  return { discounted, marketplaceFee, paymentFee, listingFee, totalFees, profit, marginPct };
}

function solvePrice(opts: {
  rule: FeeRule;
  targetProfit?: number;
  targetMarginPct?: number;
  discountPct: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
}) {
  const { rule, targetProfit, targetMarginPct, discountPct, shipCharge, shipCost, cogs } = opts;

  const mode: 'profit' | 'margin' | null =
    Number.isFinite(targetProfit as number) && (targetProfit as number) > 0
      ? 'profit'
      : Number.isFinite(targetMarginPct as number) && (targetMarginPct as number) > 0
      ? 'margin'
      : null;

  if (!mode) {
    const result = computeAtPrice({ rule, price: 0, discountPct, shipCharge, shipCost, cogs });
    return { price: 0, result };
  }

  let lo = 0;
  let hi = 1_000_000;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice({ rule, price: mid, discountPct, shipCharge, shipCost, cogs });
    const val = mode === 'profit' ? r.profit : r.marginPct;
    const tgt = mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number);
    if (val < tgt) lo = mid; else hi = mid;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const r = computeAtPrice({ rule, price: mid, discountPct, shipCharge, shipCost, cogs });
    const val = mode === 'profit' ? r.profit : r.marginPct;
    const tgt = mode === 'profit' ? (targetProfit as number) : (targetMarginPct as number);
    if (val < tgt) lo = mid; else hi = mid;
  }

  const price = Math.max(0, hi);
  const result = computeAtPrice({ rule, price, discountPct, shipCharge, shipCost, cogs });
  return { price, result };
}

/** Suspense-safe query param init */
function QueryParamsInitializer(props: {
  onInit: (vals: {
    platform?: PlatformKey;
    targetProfit?: string;
    targetMarginPct?: string;
    cogs?: string;
    shipCost?: string;
    discountPct?: string;
    shipCharge?: string;
  }) => void;
}) {
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const vals: {
      platform?: PlatformKey;
      targetProfit?: string;
      targetMarginPct?: string;
      cogs?: string;
      shipCost?: string;
      discountPct?: string;
      shipCharge?: string;
    } = {};
    const p = searchParams.get('platform');
    if (p && PLATFORMS.includes(p as PlatformKey)) vals.platform = p as PlatformKey;
    const tp = searchParams.get('targetProfit');      if (tp != null) vals.targetProfit = tp;
    const tm = searchParams.get('targetMarginPct');  if (tm != null) vals.targetMarginPct = tm;
    const cg = searchParams.get('cogs');             if (cg != null) vals.cogs = cg;
    const sc = searchParams.get('shipCost');         if (sc != null) vals.shipCost = sc;
    const dc = searchParams.get('discountPct');      if (dc != null) vals.discountPct = dc;
    const sb = searchParams.get('shipCharge');       if (sb != null) vals.shipCharge = sb;
    props.onInit(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Inlined presets controls (with dev-only Clear) */
function LocalPresetsControls(props: {
  getState: () => TargetPreset;
  applyPreset: (p: TargetPreset) => void;
  devTools?: boolean;
}) {
  const { getState, applyPreset, devTools } = props;
  const [name, setName] = React.useState('');
  const [presets, setPresets] = React.useState<NamedTargetPreset[]>([]);
  const [selected, setSelected] = React.useState<string>('');
  const [flash, setFlash] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    const items = listPresets();
    setPresets(items);
    if (items.length > 0 && !selected) setSelected(items[0].name);
  }, [selected]);

  React.useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const endFlashSoon = () => window.setTimeout(() => setFlash(null), 1500);

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFlash('Enter a name first');
      endFlashSoon();
      return;
    }
    savePreset(trimmed, getState());
    setName('');
    setSelected(trimmed);
    refresh();
    setFlash('Preset saved');
    endFlashSoon();
  };

  const onLoad = () => {
    const trimmed = selected.trim();
    if (!trimmed) return;
    const data = loadPreset(trimmed);
    if (data) {
      applyPreset(data);
      setFlash(`Loaded “${trimmed}”`);
      endFlashSoon();
    }
  };

  const onDelete = () => {
    const trimmed = selected.trim();
    if (!trimmed) return;
    deletePreset(trimmed);
    setFlash(`Deleted “${trimmed}”`);
    endFlashSoon();
    setSelected('');
    refresh();
  };

  const onClearAll = () => {
    clearAllPresets();
    refresh();
    setSelected('');
    setFlash('Cleared all presets');
    endFlashSoon();
  };

  return (
    <div className="rounded-2xl border border-purple-600/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Preset name</span>
          <input
            type="text"
            placeholder="e.g. Mercari 30% margin"
            className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button type="button" className={PILL_CLASS} onClick={onSave}>
          Save preset
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Saved presets</span>
          <select
            className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {presets.length === 0 ? (
              <option value="" className="text-black dark:text-white bg-white dark:bg-black">
                (none yet)
              </option>
            ) : null}
            {presets.map((p) => (
              <option key={p.name} value={p.name} className="text-black dark:text-white bg-white dark:bg-black">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="button" className={PILL_CLASS} onClick={onLoad} disabled={!selected}>
            Load
          </button>
          <button
            type="button"
            className={PILL_CLASS}
            onClick={onDelete}
            disabled={!selected}
            aria-label="Delete selected preset"
            title="Delete selected preset"
          >
            Delete
          </button>
          {devTools ? (
            <button
              type="button"
              className={PILL_CLASS}
              onClick={onClearAll}
              aria-label="Dev: Clear all presets"
              title="Dev-only: Clear all local presets"
            >
              Dev: Clear presets
            </button>
          ) : null}
        </div>
      </div>

      {flash ? (
        <div className="mt-3">
          <span className={PILL_CLASS} aria-live="polite" suppressHydrationWarning>
            {flash}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function ReverseCalcPage() {
  const [platform, setPlatform] = React.useState<PlatformKey>(PLATFORMS[0] ?? ('mercari' as PlatformKey));
  const [targetProfit, setTargetProfit] = React.useState<string>('25');
  const [targetMarginPct, setTargetMarginPct] = React.useState<string>('0');
  const [cogs, setCogs] = React.useState<string>('12');
  const [shipCost, setShipCost] = React.useState<string>('5');
  const [discountPct, setDiscountPct] = React.useState<string>('0');
  const [shipCharge, setShipCharge] = React.useState<string>('0');

  // feedback for link copy & save+copy
  const [copied, setCopied] = React.useState(false);
  const [copiedMsg, setCopiedMsg] = React.useState('Permalink copied!');

  // ✅ Robust dev-tools flag: start with build-time env, then enable via query (?devtools=1) after mount on non-prod host
  const [showDevTools, setShowDevTools] = React.useState(
    process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const isProdHost = window.location.hostname === 'fee-pilot.vercel.app';
    const wantsDev = new URLSearchParams(window.location.search).get('devtools') === '1';
    if (!isProdHost && wantsDev) setShowDevTools(true);
  }, []);

  const handleInitFromQuery = React.useCallback((vals: {
    platform?: PlatformKey;
    targetProfit?: string;
    targetMarginPct?: string;
    cogs?: string;
    shipCost?: string;
    discountPct?: string;
    shipCharge?: string;
  }) => {
    if (vals.platform) setPlatform(vals.platform);
    if (vals.targetProfit !== undefined) setTargetProfit(vals.targetProfit);
    if (vals.targetMarginPct !== undefined) setTargetMarginPct(vals.targetMarginPct);
    if (vals.cogs !== undefined) setCogs(vals.cogs);
    if (vals.shipCost !== undefined) setShipCost(vals.shipCost);
    if (vals.discountPct !== undefined) setDiscountPct(vals.discountPct);
    if (vals.shipCharge !== undefined) setShipCharge(vals.shipCharge);
  }, []);

  const rule = RULES[platform];

  const solved = React.useMemo(() => {
    const tProfit = parseNum(targetProfit);
    const tMargin = parseNum(targetMarginPct);
    return solvePrice({
      rule,
      targetProfit: tProfit > 0 ? tProfit : undefined,
      targetMarginPct: tMargin > 0 ? tMargin : undefined,
      discountPct: clamp(parseNum(discountPct), 0, 100),
      shipCharge: clamp(parseNum(shipCharge), 0),
      shipCost: clamp(parseNum(shipCost), 0),
      cogs: clamp(parseNum(cogs), 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, targetProfit, targetMarginPct, discountPct, shipCharge, cogs, shipCost]);

  const { price, result } = solved;

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    url.pathname = '/pro/target';
    const ordered = new URL(url.origin + url.pathname);
    ([
      ['platform', platform],
      ['targetProfit', targetProfit],
      ['targetMarginPct', targetMarginPct],
      ['cogs', cogs],
      ['shipCost', shipCost],
      ['discountPct', discountPct],
      ['shipCharge', shipCharge],
    ] as const).forEach(([k, v]) => ordered.searchParams.set(k, v));
    return ordered.toString();
  };

  const handleCopyLink = async () => {
    try {
      const link = buildShareUrl();
      await navigator.clipboard.writeText(link);
      setCopiedMsg('Permalink copied!');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert('Unable to copy link');
    }
  };

  // auto-name like: "Mercari – Profit $25" or "Mercari – Margin 30%"
  const generatePresetName = React.useCallback(() => {
    const nicePlatform = platform[0].toUpperCase() + platform.slice(1);
    const tProfit = parseNum(targetProfit);
    const tMargin = parseNum(targetMarginPct);
    const primary =
      tProfit > 0
        ? `Profit $${tProfit}`
        : tMargin > 0
        ? `Margin ${tMargin}%`
        : `Defaults`;
    return `${nicePlatform} – ${primary}`;
  }, [platform, targetProfit, targetMarginPct]);

  const getPresetState = React.useCallback((): TargetPreset => {
    return { platform, targetProfit, targetMarginPct, cogs, shipCost, discountPct, shipCharge };
  }, [platform, targetProfit, targetMarginPct, cogs, shipCost, discountPct, shipCharge]);

  const applyPreset = React.useCallback((p: TargetPreset) => {
    if (p.platform && PLATFORMS.includes(p.platform as PlatformKey)) setPlatform(p.platform as PlatformKey);
    if (typeof p.targetProfit === 'string') setTargetProfit(p.targetProfit);
    if (typeof p.targetMarginPct === 'string') setTargetMarginPct(p.targetMarginPct);
    if (typeof p.cogs === 'string') setCogs(p.cogs);
    if (typeof p.shipCost === 'string') setShipCost(p.shipCost);
    if (typeof p.discountPct === 'string') setDiscountPct(p.discountPct);
    if (typeof p.shipCharge === 'string') setShipCharge(p.shipCharge);
  }, []);

  const handleSaveAndCopyLink = async () => {
    try {
      const name = generatePresetName();
      savePreset(name, getPresetState());
      const link = buildShareUrl();
      await navigator.clipboard.writeText(link);
      setCopiedMsg(`Saved “${name}” & copied link!`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert('Unable to save or copy link');
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <React.Suspense fallback={null}>
        <QueryParamsInitializer onInit={handleInitFromQuery} />
      </React.Suspense>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reverse calculator</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Set a target profit <i>or</i> margin — we’ll suggest the listing price.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SolvingForPill
            targetProfit={parseNum(targetProfit)}
            targetMargin={parseNum(targetMarginPct)}
          />
          {copied ? (
            <span className={PILL_CLASS} aria-live="polite" suppressHydrationWarning>
              {copiedMsg}
            </span>
          ) : (
            <>
              <button type="button" onClick={handleCopyLink} className={PILL_CLASS}>
                Copy share link
              </button>
              <button type="button" onClick={handleSaveAndCopyLink} className={PILL_CLASS}>
                Save & copy link
              </button>
            </>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-purple-600/40 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Platform */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Platform</span>
            <select
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="text-black dark:text-white bg-white dark:bg-black">
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>

          {/* Target profit */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target profit ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 25"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              Set this OR margin; profit is used if both are set.
            </span>
          </label>

          {/* Target margin */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target margin (%)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(e.target.value)}
            />
          </label>

          {/* COGS */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">COGS ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={cogs}
              onChange={(e) => setCogs(e.target.value)}
            />
          </label>

          {/* Your shipping cost */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Your shipping cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={shipCost}
              onChange={(e) => setShipCost(e.target.value)}
            />
          </label>

          {/* Discount (%) */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Discount (%)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </label>

          {/* Shipping charged to buyer ($) */}
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Shipping charged to buyer ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 8"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
              value={shipCharge}
              onChange={(e) => setShipCharge(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <Link href={'/pro' as Route} className={PILL_CLASS}>
            Back to Pro
          </Link>
        </div>
      </section>

      {/* Presets */}
      <section className="mt-6">
        <LocalPresetsControls
          getState={getPresetState}
          applyPreset={applyPreset}
          devTools={showDevTools}
        />
      </section>

      {/* Results */}
      <section className="mt-6 rounded-2xl border border-purple-600/30 p-6">
        <div className="text-base font-semibold">Suggested price</div>
        <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
          ${formatMoney(price)}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Estimated profit</div>
            <div className="mt-2 text-xl font-semibold" suppressHydrationWarning>
              ${formatMoney(result.profit)}
            </div>
          </div>

          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Estimated margin</div>
            <div className="mt-2 text-xl font-semibold" suppressHydrationWarning>
              {result.marginPct.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Marketplace fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.marketplaceFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.paymentFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Listing fee</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.listingFee)}</div>
          </div>
          <div className="rounded-xl border border-purple-600/20 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total fees</div>
            <div className="mt-2" suppressHydrationWarning>${formatMoney(result.totalFees)}</div>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Now considers discount and buyer-paid shipping (both affect fee base).
        </p>
      </section>
    </main>
  );
}
