/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Footer from './components/Footer';
import HeaderActions from './components/HeaderActions';

import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from './data/fees';

// ---------- helpers ----------
function clamp(n: number, min = -1_000_000, max = 1_000_000) {
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}
const num = (v: any) => clamp(parseFloat(String(v).replace(/,/g, '')));
const fmtMoney = (v: number) =>
  `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

// Short URL keys
const QK = {
  p: 'price',
  sc: 'shipCharge',
  ss: 'shipCost',
  cg: 'cogs',
  tx: 'tax',
  dc: 'discount',
  tp: 'targetProfit',
} as const;
type Inputs = {
  platform: PlatformKey;
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  tax: number; // %
  discount: number; // %
  targetProfit: number;
};

// storage key
const LS_KEY = 'feepilot.v1';

// defaults
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

// restore from query or LS
function readFromQueryOrStorage(): Inputs {
  const url = new URL(window.location.href);
  const lsRaw = window.localStorage.getItem(LS_KEY);
  const ls: Partial<Inputs> = lsRaw ? JSON.parse(lsRaw) : {};
  const pick = <K extends keyof Inputs>(k: K, q: keyof typeof QK) => {
    if (url.searchParams.has(q)) return num(url.searchParams.get(q));
    if (ls[k] != null) return (ls[k] as number) ?? (DEFAULTS[k] as number);
    return DEFAULTS[k] as number;
  };
  const platform = (url.searchParams.get('p') as PlatformKey) ||
    (ls.platform as PlatformKey) ||
    DEFAULTS.platform;

  return {
    platform,
    price: pick('price', 'p'),
    shipCharge: pick('shipCharge', 'sc'),
    shipCost: pick('shipCost', 'ss'),
    cogs: pick('cogs', 'cg'),
    tax: pick('tax', 'tx'),
    discount: pick('discount', 'dc'),
    targetProfit: pick('targetProfit', 'tp'),
  };
}

// write query (short keys)
function writeQuery(inputs: Inputs) {
  const url = new URL(window.location.href);
  url.searchParams.set('p', inputs.platform);
  url.searchParams.set('pr', String(inputs.price));
  url.searchParams.set('sc', String(inputs.shipCharge));
  url.searchParams.set('ss', String(inputs.shipCost));
  url.searchParams.set('cg', String(inputs.cogs));
  url.searchParams.set('tx', String(inputs.tax));
  url.searchParams.set('dc', String(inputs.discount));
  url.searchParams.set('tp', String(inputs.targetProfit));
  // keep ? order short & stable
  window.history.replaceState(null, '', url.toString().replace('pr=', 'p='));
}

// compute fees for a rule + inputs
function calcFor(rule: FeeRule, inputs: Inputs) {
  // base after discount & tax collected (buyer side, not your payout tax)
  const discountedPrice =
    inputs.price * (1 - clamp(inputs.discount, 0, 100) / 100);

  // marketplace fee (percentage of (item + ship charge + tax), plus optional fixed)
  const marketplaceBase =
    discountedPrice + clamp(inputs.shipCharge, 0) + clamp(inputs.tax, 0);
  const marketplaceFee =
    marketplaceBase * (rule.marketplacePct ?? 0) + (rule.marketplaceFixed ?? 0);

  // payment fee (percentage of discounted price + fixed)
  const paymentFee =
    discountedPrice * (rule.paymentPct ?? 0) + (rule.paymentFixed ?? 0);

  const listingFee = rule.listingFee ?? 0;

  const shippingCost = clamp(inputs.shipCost, 0);
  const cogs = clamp(inputs.cogs, 0);

  const totalFees = marketplaceFee + paymentFee + listingFee;
  const net =
    discountedPrice +
    clamp(inputs.shipCharge, 0) -
    totalFees -
    shippingCost -
    cogs;

  const margin = discountedPrice
    ? (net / discountedPrice) * 100
    : 0;

  return {
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    net,
    margin,
  };
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  // first-load: merge URL or localStorage
  useEffect(() => {
    setInputs(readFromQueryOrStorage());
  }, []);

  // persist to url + localStorage
  useEffect(() => {
    writeQuery(inputs);
    window.localStorage.setItem(LS_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const rule = RULES[inputs.platform];
  const res = useMemo(() => calcFor(rule, inputs), [rule, inputs]);

  // share/copy handlers passed to HeaderActions
  const makeShareUrl = () => new URL(window.location.href).toString();
  const handleShare = async () => makeShareUrl();
  const handleCopy = async () => makeShareUrl();

  const handleReset = () => {
    window.localStorage.removeItem(LS_KEY);
    setInputs(DEFAULTS);
  };

  // UI helpers
  const ring = 'ring-1 ring-purple-500/70 rounded-2xl';

  const inputCls =
    'rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500';
  const labelCls = 'text-sm text-neutral-300 mb-1';

  const neg = res.net < 0;
  const netDisplay = neg ? `(${fmtMoney(Math.abs(res.net))})` : fmtMoney(res.net);
  const netColor = neg ? 'text-red-500' : 'text-emerald-400';

  // compare rows
  const compareRows = Object.keys(PLATFORMS).map((k) => {
    const key = k as PlatformKey;
    const r = RULES[key];
    const c = calcFor(r, inputs);
    const negRow = c.net < 0;
    return {
      key,
      name: PLATFORMS[key].label,
      net: c.net,
      margin: c.margin,
      totalFees: c.totalFees,
      marketplaceFee: c.marketplaceFee,
      paymentFee: c.paymentFee,
      listingFee: c.listingFee,
      neg: negRow,
    };
  });

  // tooltips
  const tips = {
    market:
      'Marketplace fee = percentage of (item price + shipping charged + tax) + any fixed fee.',
    payment:
      'Payment fee = percentage of item price after discount + fixed fee.',
    listing: 'Listing fee = fixed amount per listing (if applicable).',
    ship: 'Your actual shipping cost (your expense).',
    cogs: 'COGS = your cost of goods sold.',
    total: 'Total fees = marketplace fee + payment fee + listing fee.',
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div
          className="flex cursor-pointer select-none items-center gap-3"
          onClick={handleReset}
          title="Click to reset"
        >
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <div className="text-lg font-semibold text-neutral-100">FeePilot</div>
        </div>

        <HeaderActions onShare={handleShare} onCopy={handleCopy} onReset={handleReset} />
      </div>

      {/* Platform selector */}
      <section className={`mb-6 p-4 ${ring}`}>
        <div className="text-neutral-200">Platform</div>
        <select
          value={inputs.platform}
          onChange={(e) =>
            setInputs((s) => ({ ...s, platform: e.target.value as PlatformKey }))
          }
          className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500 sm:w-72"
        >
          {Object.keys(PLATFORMS).map((k) => (
            <option key={k} value={k}>
              {PLATFORMS[k as PlatformKey].label}
            </option>
          ))}
        </select>

        <div className="mt-2 text-sm text-neutral-400">
          Rules last updated:{' '}
          <span className="font-mono">{RULES_UPDATED_AT ?? ''}</span>
        </div>
      </section>

      {/* Inputs + Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inputs */}
        <section className={`p-4 ${ring}`}>
          <div className="mb-3 text-neutral-200">Inputs</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className={labelCls}>Item price ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.price}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, price: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <div className={labelCls}>Shipping charged to buyer ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.shipCharge}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, shipCharge: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <div className={labelCls}>Your shipping cost ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.shipCost}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, shipCost: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <div className={labelCls}>Cost of goods ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.cogs}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, cogs: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <div className={labelCls}>Tax collected ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.tax}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, tax: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <div className={labelCls}>Discount (%)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.discount}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, discount: num(e.target.value) }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <div className={labelCls}>Target profit ($)</div>
              <input
                inputMode="decimal"
                className={inputCls}
                value={inputs.targetProfit}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, targetProfit: num(e.target.value) }))
                }
              />
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className={`p-4 ${ring}`}>
          <div className="mb-3 text-neutral-200">Overview</div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Profit</div>
              <div className={`mt-1 text-3xl font-semibold ${netColor}`}>
                {netDisplay}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-sm text-neutral-400">Margin</div>
              <div className="mt-1 text-3xl font-semibold text-neutral-100">
                {fmtPct(res.margin)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.market}
            >
              <div className="text-sm text-neutral-400">Marketplace fee</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(res.marketplaceFee)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.payment}
            >
              <div className="text-sm text-neutral-400">Payment fee</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(res.paymentFee)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.listing}
            >
              <div className="text-sm text-neutral-400">Listing fee</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(res.listingFee)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.ship}
            >
              <div className="text-sm text-neutral-400">Shipping cost (your cost)</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(inputs.shipCost)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.cogs}
            >
              <div className="text-sm text-neutral-400">COGS</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(inputs.cogs)}
              </div>
            </div>

            <div
              className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              title={tips.total}
            >
              <div className="text-sm text-neutral-400">Total fees</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-100">
                {fmtMoney(res.totalFees)}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Compare */}
      <section className={`mt-6 p-4 ${ring}`}>
        <div className="mb-3 text-neutral-200">
          Comparing with current inputs (
          <span className="font-semibold">${inputs.price.toFixed(2)}</span> price,{' '}
          <span className="font-semibold">${inputs.shipCharge.toFixed(2)}</span> ship
          charge, <span className="font-semibold">${inputs.shipCost.toFixed(2)}</span>{' '}
          ship cost, <span className="font-semibold">${inputs.cogs.toFixed(2)}</span>{' '}
          COGS, <span className="font-semibold">{inputs.discount}%</span> discount,{' '}
          <span className="font-semibold">${inputs.tax.toFixed(2)}</span> tax).
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-neutral-200">
            <thead className="text-sm text-neutral-400">
              <tr>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Profit</th>
                <th className="px-3 py-2">Margin</th>
                <th className="px-3 py-2" title={tips.market}>
                  Marketplace fee
                </th>
                <th className="px-3 py-2" title={tips.payment}>
                  Payment fee
                </th>
                <th className="px-3 py-2" title={tips.listing}>
                  Listing fee
                </th>
                <th className="px-3 py-2" title={tips.total}>
                  Total fees
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {compareRows.map((row) => (
                <tr key={row.key} className="border-t border-neutral-800/70">
                  <td className="px-3 py-2">
                    <span className="rounded-md border border-neutral-800/70 bg-neutral-950/70 px-2 py-1">
                      {row.name}
                    </span>
                  </td>
                  <td className={`px-3 py-2 ${row.neg ? 'text-red-500' : 'text-emerald-400'}`}>
                    {row.neg
                      ? `(${fmtMoney(Math.abs(row.net))})`
                      : fmtMoney(row.net)}
                  </td>
                  <td className="px-3 py-2">{fmtPct(row.margin)}</td>
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

      <div className="mt-8 text-center text-xs text-neutral-500">
        FeePilot is made by GP Creative Studios.{' '}
        <button
          className="underline decoration-dotted underline-offset-2"
          onClick={() => {
            navigator.clipboard.writeText('gpcreativestudios2018@gmail.com');
          }}
          title="Click to copy the email address"
        >
          (contact)
        </button>
      </div>

      <div className="mt-8" />

      <Footer />
    </main>
  );
}
