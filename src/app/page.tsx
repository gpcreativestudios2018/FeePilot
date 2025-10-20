'use client';

import { useMemo, useState, useEffect } from 'react';
import HeaderActions from './components/HeaderActions';
import {
  PLATFORMS,
  RULES,
  RULES_UPDATED_AT,
  type PlatformKey,
  type FeeRule,
} from '@/data/fees';

/** ---------- tiny helpers ---------- */
const clamp = (n: number, min = -1_000_000, max = 1_000_000) =>
  isFinite(n) ? Math.min(Math.max(n, min), max) : 0;

const asMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

/** Parse number input safely */
const parseNum = (v: string) => {
  const n = Number(v.replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : 0;
};

/** --------- small components (local to page) ---------- */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs border border-purple-500/40 text-purple-200/90">
      {children}
    </span>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-500/30 p-5">
      <div className="text-purple-300/90 mb-2">{title}</div>
      <div className="text-3xl font-semibold text-emerald-300">{value}</div>
    </div>
  );
}

/** --------- BREAKDOWN GRID ---------- */
function Breakdown({
  payout,
  marginPct,
  mktFee,
  payFee,
  listFee,
  shipCost,
  cogs,
  totalFees,
}: {
  payout: number;
  marginPct: number;
  mktFee: number;
  payFee: number;
  listFee: number;
  shipCost: number;
  cogs: number;
  totalFees: number;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Profit" value={asMoney(payout)} />
      <Card title="Margin" value={`${marginPct.toFixed(1)}%`} />
      <Card title="Marketplace fee" value={asMoney(mktFee)} />
      <Card title="Payment fee" value={asMoney(payFee)} />
      <Card title="Listing fee" value={asMoney(listFee)} />
      <Card title="Shipping cost (your cost)" value={asMoney(shipCost)} />
      <Card title="COGS" value={asMoney(cogs)} />
      <Card title="Total fees" value={asMoney(totalFees)} />
    </div>
  );
}

/** --------- COMPARE TABLE ---------- */
function CompareTable({
  inputs,
}: {
  inputs: {
    price: number;
    shipCharge: number;
    shipCost: number;
    cogs: number;
    discountPct: number;
    tax: number;
  };
}) {
  type Row = {
    platform: PlatformKey;
    profit: number;
    margin: number;
    mkt: number;
    pay: number;
    list: number;
    total: number;
  };

  const rows: Row[] = useMemo(() => {
    const list: Row[] = [];
    Object.keys(RULES).forEach((key) => {
      const p = key as PlatformKey;
      const rule = RULES[p] as FeeRule;

      const discounted = inputs.price * (1 - inputs.discountPct / 100);
      const grossToSeller = discounted + inputs.shipCharge;

      const marketplaceFee =
        (rule.marketplacePct ?? 0) * grossToSeller / 100 +
        (rule.marketplaceFixed ?? 0);

      const paymentBase = grossToSeller;
      const paymentFee =
        (rule.paymentPct ?? 0) * paymentBase / 100 +
        (rule.paymentFixed ?? 0);

      const listingFee = rule.listingFixed ?? 0;

      const totalFees = marketplaceFee + paymentFee + listingFee;
      const net = discounted + inputs.shipCharge - totalFees - inputs.shipCost - inputs.cogs - inputs.tax;
      const margin =
        (net / (discounted + inputs.shipCharge || 1)) * 100;

      list.push({
        platform: p,
        profit: net,
        margin,
        mkt: marketplaceFee,
        pay: paymentFee,
        list: listingFee,
        total: totalFees,
      });
    });
    return list.sort((a, b) => b.profit - a.profit);
  }, [inputs]);

  return (
    <div className="rounded-2xl border border-purple-500/30 p-4">
      <div className="text-purple-200/90 mb-3">
        Comparing with current inputs (
        <Badge>
          {asMoney(inputs.price)} price
        </Badge>
        , <Badge>{asMoney(inputs.shipCharge)} ship charge</Badge>,{' '}
        <Badge>{asMoney(inputs.shipCost)} ship cost</Badge>,{' '}
        <Badge>{asMoney(inputs.cogs)} COGS</Badge>,{' '}
        <Badge>{inputs.discountPct.toFixed(1)}% discount</Badge>,{' '}
        <Badge>{asMoney(inputs.tax)} tax</Badge>).
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="text-sm text-purple-200/80">
            <tr>
              <th className="py-2">Platform</th>
              <th className="py-2">Profit</th>
              <th className="py-2">Margin</th>
              <th className="py-2">Marketplace fee</th>
              <th className="py-2">Payment fee</th>
              <th className="py-2">Listing fee</th>
              <th className="py-2">Total fees</th>
            </tr>
          </thead>
          <tbody className="text-[15px]">
            {rows.map((r) => (
              <tr key={r.platform} className="border-t border-white/5">
                <td className="py-3">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-sm">
                    {r.platform}
                  </span>
                </td>
                <td className="py-3 text-emerald-300">{asMoney(r.profit)}</td>
                <td className="py-3">{r.margin.toFixed(1)}%</td>
                <td className="py-3">{asMoney(r.mkt)}</td>
                <td className="py-3">{asMoney(r.pay)}</td>
                <td className="py-3">{asMoney(r.list)}</td>
                <td className="py-3">{asMoney(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ================== PAGE ================== */
export default function Page() {
  // persisted settings (so returning users keep inputs)
  const [platform, setPlatform] = useState<PlatformKey>('mercari');
  const [price, setPrice] = useState(120);
  const [shipCharge, setShipCharge] = useState(0);
  const [shipCost, setShipCost] = useState(10);
  const [cogs, setCogs] = useState(40);
  const [discountPct, setDiscountPct] = useState(0);
  const [tax, setTax] = useState(0);
  const [targetProfit, setTargetProfit] = useState(50);

  useEffect(() => {
    const raw = localStorage.getItem('feepilot_v1');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setPlatform(s.platform ?? 'mercari');
        setPrice(s.price ?? 120);
        setShipCharge(s.shipCharge ?? 0);
        setShipCost(s.shipCost ?? 10);
        setCogs(s.cogs ?? 40);
        setDiscountPct(s.discountPct ?? 0);
        setTax(s.tax ?? 0);
        setTargetProfit(s.targetProfit ?? 50);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'feepilot_v1',
      JSON.stringify({
        platform,
        price,
        shipCharge,
        shipCost,
        cogs,
        discountPct,
        tax,
        targetProfit,
      })
    );
  }, [platform, price, shipCharge, shipCost, cogs, discountPct, tax, targetProfit]);

  const rule = RULES[platform] as FeeRule;

  const calc = useMemo(() => {
    const discounted = price * (1 - discountPct / 100);
    const grossToSeller = discounted + shipCharge;

    const marketplaceFee =
      (rule.marketplacePct ?? 0) * grossToSeller / 100 +
      (rule.marketplaceFixed ?? 0);

    const paymentFee =
      (rule.paymentPct ?? 0) * grossToSeller / 100 +
      (rule.paymentFixed ?? 0);

    const listingFee = rule.listingFixed ?? 0;

    const totalFees = marketplaceFee + paymentFee + listingFee;
    const profit =
      discounted + shipCharge - totalFees - shipCost - cogs - tax;

    const margin =
      (profit / (discounted + shipCharge || 1)) * 100;

    // price you’d need to hit target profit (rough, fee-on-price approx)
    const pctOnPrice =
      ((rule.marketplacePct ?? 0) + (rule.paymentPct ?? 0)) / 100;
    const fixed = (rule.marketplaceFixed ?? 0) + (rule.paymentFixed ?? 0) + (rule.listingFixed ?? 0);
    const requiredPrice =
      (targetProfit + shipCost + cogs + tax + fixed - shipCharge) /
      (1 - pctOnPrice);

    return {
      discounted,
      grossToSeller,
      marketplaceFee,
      paymentFee,
      listingFee,
      totalFees,
      profit,
      margin,
      requiredPrice: isFinite(requiredPrice) ? Math.max(0, requiredPrice) : 0,
    };
  }, [price, shipCharge, discountPct, shipCost, cogs, tax, rule, targetProfit]);

  const shareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('p', platform);
    url.searchParams.set('price', String(price));
    url.searchParams.set('shipCharge', String(shipCharge));
    url.searchParams.set('shipCost', String(shipCost));
    url.searchParams.set('cogs', String(cogs));
    url.searchParams.set('discount', String(discountPct));
    url.searchParams.set('tax', String(tax));
    navigator.clipboard.writeText(url.toString());
    return url.toString();
  };

  const copyLink = async () => {
    await shareLink();
    return 'copied';
  };

  // load from URL (Share)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get('p') as PlatformKey | null;
    if (p && PLATFORMS.includes(p)) setPlatform(p);
    const n = (k: string, setter: (n: number) => void) => {
      const v = q.get(k);
      if (v != null) setter(parseNum(v));
    };
    n('price', setPrice);
    n('shipCharge', setShipCharge);
    n('shipCost', setShipCost);
    n('cogs', setCogs);
    n('discount', setDiscountPct);
    n('tax', setTax);
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-5 py-10 text-white">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-semibold">FeePilot</div>
          <div className="rounded-full border border-purple-500/40 px-3 py-1 text-sm text-purple-200">
            Rules last updated: {RULES_UPDATED_AT}
          </div>
        </div>
        <HeaderActions onShare={shareLink} onCopy={copyLink} />
      </header>

      {/* Inputs */}
      <section className="rounded-2xl border border-purple-500/40 p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-purple-200/90 block mb-2">
              Platform <span className="opacity-60">(?)</span>
            </label>
            <select
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={platform}
              onChange={(e) =>
                setPlatform((e.target.value as PlatformKey) ?? 'mercari')
              }
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">
              Item price <span className="opacity-60">(?)</span>
            </label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={price}
              onChange={(e) => setPrice(clamp(parseNum(e.target.value)))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">
              Discount % <span className="opacity-60">(?)</span>
            </label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={discountPct}
              onChange={(e) => setDiscountPct(clamp(parseNum(e.target.value), 0, 100))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">
              Shipping charged to buyer ($)
            </label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={shipCharge}
              onChange={(e) => setShipCharge(clamp(parseNum(e.target.value)))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">
              Your shipping cost ($)
            </label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={shipCost}
              onChange={(e) => setShipCost(clamp(parseNum(e.target.value)))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">COGS ($)</label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={cogs}
              onChange={(e) => setCogs(clamp(parseNum(e.target.value)))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">Tax collected ($)</label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={tax}
              onChange={(e) => setTax(clamp(parseNum(e.target.value)))}
            />
          </div>

          <div>
            <label className="text-purple-200/90 block mb-2">Target profit ($)</label>
            <input
              inputMode="decimal"
              className="w-full rounded-xl bg-black/30 border border-purple-500/30 px-3 py-2 outline-none"
              value={targetProfit}
              onChange={(e) => setTargetProfit(clamp(parseNum(e.target.value)))}
            />
            <div className="mt-2 text-sm text-purple-200/80">
              You’d need ~{asMoney(calc.requiredPrice)} list price to hit the target.
            </div>
          </div>
        </div>
      </section>

      {/* Summary tiles */}
      <section className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-purple-500/30 p-5">
            <div className="text-purple-300/90 mb-2">Discounted price</div>
            <div className="text-3xl font-semibold">{asMoney(calc.discounted)}</div>
          </div>
          <div className="rounded-2xl border border-purple-500/30 p-5">
            <div className="text-purple-300/90 mb-2">Marketplace fee</div>
            <div className="text-3xl font-semibold">{asMoney(calc.marketplaceFee)}</div>
          </div>
          <div className="rounded-2xl border border-purple-500/30 p-5">
            <div className="text-purple-300/90 mb-2">Estimated payout</div>
            <div className="text-3xl font-semibold">{asMoney(calc.profit)}</div>
          </div>
        </div>
      </section>

      {/* Detailed breakdown */}
      <section className="mb-8">
        <Breakdown
          payout={calc.profit}
          marginPct={calc.margin}
          mktFee={calc.marketplaceFee}
          payFee={calc.paymentFee}
          listFee={calc.listingFee}
          shipCost={shipCost}
          cogs={cogs}
          totalFees={calc.totalFees}
        />
      </section>

      {/* Compare all platforms */}
      <section className="mb-12">
        <CompareTable
          inputs={{ price, shipCharge, shipCost, cogs, discountPct, tax }}
        />
      </section>

      <footer className="text-center text-purple-200/80">
        FeePilot by GP Creative Studios &nbsp;
        <a className="underline" href="mailto:info@gpcreativestudios.com">
          (contact)
        </a>
      </footer>
    </main>
  );
}
