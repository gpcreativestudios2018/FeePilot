'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';
import ResetButton from './components/ResetButton';
import ThemeToggle from './components/ThemeToggle';
import ClearSavedDataButton from './components/ClearSavedDataButton';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  PLATFORM_LABELS,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

import { cx, formatMoneyWithParens } from '../lib/format';
import copyWithToast from '../lib/copyWithToast';
import ComparisonTableSection from './components/ComparisonTableSection';

/* -------------------------------- analytics -------------------------------- */
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}
const track = (event: string, props?: Record<string, unknown>) => {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {}
};

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

function calcFor(rule: FeeRule, inputs: Inputs, offsiteAdsEnabled = false) {
  const discounted = clamp(inputs.price * (1 - pct(inputs.discountPct)));
  const base = discounted + inputs.shipCharge;

  // Handle tiered fees (e.g., Poshmark: flat $2.95 under $15, 20% for $15+)
  const hasTieredFee =
    rule.flatFeeThreshold !== undefined && rule.flatFee !== undefined;
  const useFlatFee = hasTieredFee && discounted < (rule.flatFeeThreshold ?? 0);

  const marketplaceFee = useFlatFee
    ? rule.flatFee ?? 0
    : clamp(base * pct(rule.marketplacePct ?? 0)) + (rule.marketplaceFixed ?? 0);
  const paymentFee =
    clamp(base * pct(rule.paymentPct ?? 0)) + (rule.paymentFixed ?? 0);
  const listingFee = getListingFixed(rule);
  const offsiteAdsFee = offsiteAdsEnabled ? clamp(base * pct(rule.offsiteAdsPct ?? 0)) : 0;

  const totalFees = marketplaceFee + paymentFee + listingFee + offsiteAdsFee;

  const net =
    discounted +
    inputs.shipCharge -
    totalFees -
    inputs.shipCost -
    inputs.cogs -
    inputs.tax;

  const profit = net;
  const marginPct = discounted > 0 ? (profit / discounted) * 100 : 0;

  return {
    discounted,
    marketplaceFee,
    paymentFee,
    listingFee,
    offsiteAdsFee,
    totalFees,
    net,
    profit,
    marginPct,
  };
}

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

/* -------------------------- platform docs links --------------------------- */
const PLATFORM_DOC_LINKS: Partial<
  Record<
    PlatformKey,
    {
      href: Route;
      name: string;
    }
  >
> = {
  etsy: { href: '/docs/etsy-fees', name: 'Etsy' },
  depop: { href: '/docs/depop-fees', name: 'Depop' },
  mercari: { href: '/docs/mercari-fees', name: 'Mercari' },
  poshmark: { href: '/docs/poshmark-fees', name: 'Poshmark' },
  ebay: { href: '/docs/ebay-fees', name: 'eBay' },
  stockx: { href: '/docs/stockx-fees', name: 'StockX' },
};

/* ------------------------- PERSISTENCE KEYS -------------------------------- */
const THEME_KEY = 'feepilot:theme'; // 'light' | 'dark'
const INPUTS_KEY = 'feepilot:inputs:v1'; // JSON of Inputs

/* ------------------------- PERMALINK HELPERS ------------------------------- */
function buildPermalinkUrl(inputs: Inputs): string {
  const url = new URL(window.location.href);
  // clear existing to avoid duplicates
  url.searchParams.delete('platform');
  url.searchParams.delete('price');
  url.searchParams.delete('shipCharge');
  url.searchParams.delete('shipCost');
  url.searchParams.delete('cogs');
  url.searchParams.delete('discountPct');
  url.searchParams.delete('tax');

  url.searchParams.set('platform', inputs.platform);
  url.searchParams.set('price', String(inputs.price));
  url.searchParams.set('shipCharge', String(inputs.shipCharge));
  url.searchParams.set('shipCost', String(inputs.shipCost));
  url.searchParams.set('cogs', String(inputs.cogs));
  url.searchParams.set('discountPct', String(inputs.discountPct));
  url.searchParams.set('tax', String(inputs.tax));

  return url.toString();
}

function inputsFromSearch(): Inputs | null {
  try {
    const url = new URL(window.location.href);
    const hasAny =
      url.searchParams.has('platform') ||
      url.searchParams.has('price') ||
      url.searchParams.has('shipCharge') ||
      url.searchParams.has('shipCost') ||
      url.searchParams.has('cogs') ||
      url.searchParams.has('discountPct') ||
      url.searchParams.has('tax');

    if (!hasAny) return null;

    const d = makeDefaults();
    const platformParam = url.searchParams.get('platform') ?? d.platform;
    const platform = PLATFORMS.includes(platformParam as PlatformKey)
      ? (platformParam as PlatformKey)
      : d.platform;

    const candidate: Inputs = {
      platform,
      price: parseNum(url.searchParams.get('price') ?? String(d.price)),
      shipCharge: parseNum(url.searchParams.get('shipCharge') ?? String(d.shipCharge)),
      shipCost: parseNum(url.searchParams.get('shipCost') ?? String(d.shipCost)),
      cogs: parseNum(url.searchParams.get('cogs') ?? String(d.cogs)),
      discountPct: parseNum(
        url.searchParams.get('discountPct') ?? String(d.discountPct),
      ),
      tax: parseNum(url.searchParams.get('tax') ?? String(d.tax)),
    };

    // clamp to keep safe
    candidate.price = clamp(candidate.price, 0);
    candidate.shipCharge = clamp(candidate.shipCharge, 0);
    candidate.shipCost = clamp(candidate.shipCost, 0);
    candidate.cogs = clamp(candidate.cogs, 0);
    candidate.discountPct = clamp(candidate.discountPct, 0, 100);
    candidate.tax = clamp(candidate.tax, 0);

    return candidate;
  } catch {
    return null;
  }
}

/* ----------------------- SCENARIO PRESETS (HOME) -------------------------- */

type ScenarioPresetId = 'low-flip' | 'high-ticket-sneaker' | 'bundle-sale';

type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  apply: (platform: PlatformKey, previous: Inputs) => Partial<Inputs>;
};

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'low-flip',
    label: 'Low-price flip',
    description: 'Cheap tee / small item flip with basic shipping.',
    apply: (platform) => {
      // More realistic per-platform low-ticket flips
      switch (platform) {
        case 'poshmark':
          return {
            price: 25,
            cogs: 5,
            shipCharge: 0,
            shipCost: 0,
          };
        case 'depop':
          return {
            price: 30,
            cogs: 8,
            shipCharge: 5.99,
            shipCost: 6.5,
          };
        case 'etsy':
          return {
            price: 22,
            cogs: 5,
            shipCharge: 4.99,
            shipCost: 5.5,
          };
        case 'mercari':
          return {
            price: 25,
            cogs: 6,
            shipCharge: 4.99,
            shipCost: 6,
          };
        case 'ebay':
          return {
            price: 25,
            cogs: 5,
            shipCharge: 4.99,
            shipCost: 5.5,
          };
        case 'stockx':
          return {
            price: 60,
            cogs: 35,
            shipCharge: 0,
            shipCost: 0,
          };
        default:
          return {
            price: 25,
            cogs: 5,
            shipCharge: 4.99,
            shipCost: 5.5,
          };
      }
    },
  },
  {
    id: 'high-ticket-sneaker',
    label: 'High-ticket sneaker',
    description: 'Premium sneaker sale on StockX/eBay-style platforms.',
    apply: (platform) => {
      switch (platform) {
        case 'stockx':
          return {
            price: 350,
            cogs: 220,
            shipCharge: 0,
            shipCost: 18,
          };
        case 'ebay':
          return {
            price: 320,
            cogs: 200,
            shipCharge: 14.99,
            shipCost: 18,
          };
        case 'depop':
        case 'poshmark':
          return {
            price: 260,
            cogs: 160,
            shipCharge: 0,
            shipCost: 18,
          };
        case 'mercari':
          return {
            price: 280,
            cogs: 170,
            shipCharge: 0,
            shipCost: 18,
          };
        case 'etsy':
          return {
            price: 260,
            cogs: 160,
            shipCharge: 9.99,
            shipCost: 18,
          };
        default:
          return {
            price: 280,
            cogs: 190,
            shipCharge: 0,
            shipCost: 18,
          };
      }
    },
  },
  {
    id: 'bundle-sale',
    label: 'Bundle sale',
    description: 'Multiple items bundled with free shipping.',
    apply: (platform) => {
      switch (platform) {
        case 'poshmark':
        case 'depop':
          return {
            price: 85,
            cogs: 30,
            shipCharge: 0,
            shipCost: 12,
          };
        case 'mercari':
          return {
            price: 95,
            cogs: 35,
            shipCharge: 0,
            shipCost: 14,
          };
        case 'etsy':
          return {
            price: 110,
            cogs: 40,
            shipCharge: 0,
            shipCost: 15,
          };
        case 'ebay':
          return {
            price: 120,
            cogs: 45,
            shipCharge: 0,
            shipCost: 16,
          };
        case 'stockx':
          return {
            price: 260,
            cogs: 180,
            shipCharge: 0,
            shipCost: 20,
          };
        default:
          return {
            price: 120,
            cogs: 40,
            shipCharge: 0,
            shipCost: 15,
          };
      }
    },
  },
];

/* ----------------------------------- UI ----------------------------------- */
export default function HomeClient() {
  // Inputs init priority: URL query params → localStorage → defaults.
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (typeof window === 'undefined') return makeDefaults();

    const fromUrl = inputsFromSearch();
    if (fromUrl) return fromUrl;

    try {
      const raw = window.localStorage.getItem(INPUTS_KEY);
      if (!raw) return makeDefaults();
      const p = JSON.parse(raw) as Partial<Inputs>;
      const d = makeDefaults();
      return {
        platform:
          p.platform && PLATFORMS.includes(p.platform as PlatformKey)
            ? (p.platform as PlatformKey)
            : d.platform,
        price: Number.isFinite(p.price) ? (p.price as number) : d.price,
        shipCharge: Number.isFinite(p.shipCharge)
          ? (p.shipCharge as number)
          : d.shipCharge,
        shipCost: Number.isFinite(p.shipCost) ? (p.shipCost as number) : d.shipCost,
        cogs: Number.isFinite(p.cogs) ? (p.cogs as number) : d.cogs,
        discountPct: Number.isFinite(p.discountPct)
          ? (p.discountPct as number)
          : d.discountPct,
        tax: Number.isFinite(p.tax) ? (p.tax as number) : d.tax,
      };
    } catch {
      return makeDefaults();
    }
  });

  // Etsy-specific: offsite ads toggle (not persisted in Inputs for simplicity)
  const [etsyOffsiteAds, setEtsyOffsiteAds] = useState(false);

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

  // Persist inputs whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  // Persist theme whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    } catch {}
  }, [isLight]);

  // Share / Copy use permalink with current inputs
  const shareLink = async (): Promise<void> => {
    const url = buildPermalinkUrl(inputs);
    track('Share', { platform: inputs.platform });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FeePilot', url });
      } catch {
        // user canceled
      }
    } else {
      await copyWithToast(url); // fallback copies + shows toast
    }
  };
  const copyLink = async (): Promise<void> => {
    const url = buildPermalinkUrl(inputs);
    await copyWithToast(url); // copies + shows toast
    track('Copy Link', { platform: inputs.platform });
  };

  const resetInputs = () => {
    const next = makeDefaults();
    setInputs(next);
    try {
      window.localStorage.removeItem(INPUTS_KEY);
    } catch {}
    // also strip query params so refresh doesn’t re-apply them
    try {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const rule = RULES[inputs.platform];
  // Pass offsite ads toggle only for Etsy
  const shouldApplyOffsiteAds = inputs.platform === 'etsy' && etsyOffsiteAds;
  const current = useMemo(
    () => calcFor(rule, inputs, shouldApplyOffsiteAds),
    [rule, inputs, shouldApplyOffsiteAds],
  );

  // derive the comparison rows once so we can reference .length for analytics
  const tableComparison = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = RULES[p];
      // Apply offsite ads only to Etsy row when toggle is on
      const applyAds = p === 'etsy' && etsyOffsiteAds;
      const c = calcFor(r, inputs, applyAds);
      return {
        platform: p,
        profit: c.profit,
        marginPct: c.marginPct,
        marketplaceFee: c.marketplaceFee,
        paymentFee: c.paymentFee,
        listingFee: c.listingFee,
        offsiteAdsFee: c.offsiteAdsFee,
        totalFees: c.totalFees,
      };
    });
  }, [inputs, etsyOffsiteAds]);

  // theme helpers
  const pageBgText = isLight ? 'bg-white text-black' : 'bg-black text-white';
  const subtleText = isLight ? 'text-gray-700' : 'text-gray-300';
  const selectOption = isLight ? 'bg-white text-black' : 'bg-black text-white';
  const panelBorder = isLight ? 'border-purple-800/70' : 'border-purple-600/40';
  const controlBorder = isLight ? 'border-purple-800/70' : 'border-purple-600/50';

  // unified pill style (kept in each component where needed)
  const pillButton = cx(
    'rounded-full px-4 py-2 text-base select-none border',
    isLight
      ? 'border-purple-800/70 text-black hover:bg-purple-50'
      : 'border-purple-600/50 text-white hover:bg-white/5',
  );

  const currentPlatformDoc = PLATFORM_DOC_LINKS[inputs.platform];

  // Show dev tools (like "Clear saved data") in dev OR when the preview flag is set
  const showDevTools =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_TOOLS === '1';

  // ---- CSV + Get Pro analytics with zero UI change ----
  useEffect(() => {
    const proCheckoutUrl = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || '';

    const findInteractive = (el: HTMLElement | null): HTMLElement | null => {
      let cur: HTMLElement | null = el;
      while (cur) {
        if (cur.tagName === 'A' || cur.tagName === 'BUTTON') return cur;
        cur = cur.parentElement;
      }
      return null;
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      const node = findInteractive(t);
      const anchor = node && node.tagName === 'A' ? (node as HTMLAnchorElement) : null;

      const text = ((node?.textContent || t.textContent) || '').trim().toLowerCase();
      const title = (node?.getAttribute('title') || '').toLowerCase();
      const aria = (node?.getAttribute('aria-label') || '').toLowerCase();
      const href = anchor?.getAttribute('href') || '';

      // CSV export button(s)
      const isCsv =
        text.includes('export csv') ||
        text.includes('download csv') ||
        title.includes('export csv') ||
        title.includes('download csv') ||
        aria.includes('export csv') ||
        aria.includes('download csv');

      if (isCsv) {
        track('Download CSV', { rows: tableComparison.length });
        return;
      }

      // Get Pro CTA: match text, aria/title, /pro links, Stripe checkout links, or configured checkout URL
      const isStripeHref =
        href.includes('checkout.stripe.com') ||
        href.includes('stripe.com/pay') ||
        (!!proCheckoutUrl && href.includes(proCheckoutUrl));

      const isProText =
        text.includes('get pro') ||
        text.includes('upgrade') ||
        title.includes('get pro') ||
        title.includes('upgrade') ||
        aria.includes('get pro') ||
        aria.includes('upgrade');

      const isProPath = href.includes('/pro');

      if (isProText || isProPath || isStripeHref) {
        track('Get Pro Click', {
          href: href || null,
          where: node?.tagName?.toLowerCase() || 'unknown',
        });
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [tableComparison.length]);

  return (
    <div className={cx('min-h-dvh', pageBgText)}>
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            {/* accent dot */}
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full bg-purple-500 ring-2 ring-purple-400/50"
            />
            <Link href={'/' as Route} className="outline-none focus:underline">
              FeePilot
            </Link>
          </h1>

          <div className="flex items-center gap-3">
            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            <ResetButton onClick={resetInputs} />
            {/* Share / Copy / Pro */}
            <HeaderActions onShare={shareLink} onCopy={copyLink} />
            {/* Dev-only helper after Pro (shows in dev or when preview flag is set) */}
            {showDevTools && (
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
            isLight ? 'text-purple-700' : 'text-purple-200',
          )}
        >
          Rules last updated: {RULES_UPDATED_AT}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* Intro / tagline */}
        <section className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-purple-300">
            Marketplace fee calculator
          </h2>
          <p className={cx('mt-1 max-w-2xl text-sm sm:text-base', subtleText)}>
            Estimate your profit after marketplace fees, shipping, and tax across platforms
            like Etsy, eBay, Poshmark, Depop, Mercari, and StockX.
          </p>
        </section>

        {/* Inputs */}
        <section className={cx('rounded-2xl border p-4 sm:p-6', panelBorder)}>
          {/* Scenario presets row */}
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <p className={cx('text-xs sm:text-sm', subtleText)}>
              Try a quick scenario to see real numbers:
            </p>
            <div className="flex flex-wrap gap-2">
              {SCENARIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={cx(
                    pillButton,
                    'px-3 py-1 text-xs sm:text-sm',
                    'border-dashed',
                  )}
                  title={preset.description}
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      ...preset.apply(prev.platform, prev),
                    }))
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                className={cx(
                  'mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between',
                  subtleText,
                )}
              >
                <span>Platform</span>
                {currentPlatformDoc && (
                  <span className="text-xs sm:text-[11px]">
                    {currentPlatformDoc.name} fee guide{' '}
                    <Link
                      href={currentPlatformDoc.href}
                      className={cx(
                        'underline decoration-dotted',
                        isLight
                          ? 'text-purple-700 hover:text-purple-900'
                          : 'text-purple-300 hover:text-purple-100',
                      )}
                    >
                      here
                    </Link>
                  </span>
                )}
              </label>
              <select
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.platform}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, platform: e.target.value as PlatformKey }))
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className={selectOption}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
              {/* Etsy-specific offsite ads toggle */}
              {inputs.platform === 'etsy' && (
                <label
                  className={cx(
                    'mt-3 flex cursor-pointer items-center gap-2 text-sm',
                    subtleText,
                  )}
                >
                  <input
                    type="checkbox"
                    checked={etsyOffsiteAds}
                    onChange={(e) => setEtsyOffsiteAds(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 accent-purple-500"
                  />
                  <span>Offsite Ads applied (15%)</span>
                </label>
              )}
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                Item price ($)
                <span className="mt-1 block text-xs opacity-70">
                  Sale price for the item, before shipping and tax.
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.price}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    price: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                Discount (%)
                <span className="mt-1 block text-xs opacity-70">
                  Percent off the original price (offers, promos, coupons).
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.discountPct}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    discountPct: clamp(parseNum(e.target.value), 0, 100),
                  }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                Shipping charged to buyer ($)
                <span className="mt-1 block text-xs opacity-70">
                  What the buyer pays for shipping. Use 0 for &quot;free shipping&quot;.
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.shipCharge}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    shipCharge: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                Your shipping cost ($)
                <span className="mt-1 block text-xs opacity-70">
                  Your actual shipping expense (labels, postage, etc.).
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.shipCost}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    shipCost: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                COGS ($)
                <span className="mt-1 block text-xs opacity-70">
                  What you paid for the item (inventory cost).
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.cogs}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    cogs: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>

            <div>
              <label className={cx('mb-2 block text-sm', subtleText)}>
                Tax collected ($)
                <span className="mt-1 block text-xs opacity-70">
                  Sales tax / VAT collected on the order.
                </span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className={cx(
                  'w-full rounded-xl border bg-transparent px-3 py-2 outline-none',
                  controlBorder,
                )}
                value={inputs.tax}
                onChange={(e) =>
                  setInputs((s) => ({
                    ...s,
                    tax: clamp(parseNum(e.target.value), 0),
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* Cards – ALL 8 */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Discounted price</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.discounted)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Marketplace fee</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.marketplaceFee)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Payment fee</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.paymentFee)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Listing fee</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.listingFee)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Total fees</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.totalFees)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Estimated payout</div>
            <div className="mt-2 text-3xl font-semibold" suppressHydrationWarning>
              {formatMoneyWithParens(current.net)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Profit</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold',
                current.profit < 0
                  ? 'text-red-500'
                  : isLight
                  ? 'text-emerald-700'
                  : 'text-emerald-300',
              )}
              suppressHydrationWarning
            >
              {formatMoneyWithParens(current.profit)}
            </div>
          </div>

          <div className={cx('rounded-2xl border p-5', panelBorder)}>
            <div className={cx('text-sm', subtleText)}>Margin</div>
            <div
              className={cx(
                'mt-2 text-3xl font-semibold',
                current.marginPct < 0 && 'text-red-500',
              )}
              suppressHydrationWarning
            >
              {current.marginPct.toFixed(1)}%
            </div>
          </div>
        </section>

        {/* Official source link */}
        {rule.sourceUrl && (
          <div className="mt-4 text-center">
            <a
              href={rule.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(
                'inline-flex items-center gap-1 text-xs',
                isLight
                  ? 'text-gray-500 hover:text-purple-700'
                  : 'text-gray-400 hover:text-purple-300',
              )}
            >
              View official {PLATFORM_LABELS[inputs.platform]} fees →
            </a>
          </div>
        )}

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
          comparison={tableComparison}
        />

        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}

/* Typed route helper for Link */
type Route =
  | '/'
  | '/about'
  | '/docs'
  | '/pro'
  | '/pro/target'
  | '/docs/etsy-fees'
  | '/docs/depop-fees'
  | '/docs/mercari-fees'
  | '/docs/poshmark-fees'
  | '/docs/ebay-fees'
  | '/docs/stockx-fees';
