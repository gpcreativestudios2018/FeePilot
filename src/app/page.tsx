'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PLATFORMS,
  RULES,
  calcAllFees,
  type PlatformKey,
} from '@/data/fees';

// ---------- helpers ----------

function fmtMoney(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  return n < 0 ? `(${s})` : s;
}

function parseNum(v: string | null, def = 0): number {
  if (v == null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

type NumInputProps = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  right?: string;
};

function NumInput({ label, value, onChange, right }: NumInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-neutral-300">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-neutral-100 outline-none focus:border-purple-500"
          inputMode="decimal"
        />
        {right && (
          <span className="pointer-events-none absolute right-2 top-2 text-neutral-500">
            {right}
          </span>
        )}
      </div>
    </label>
  );
}

// shorter query keys
const Q = {
  p: 'p',   // platform
  pr: 'pr', // price
  sc: 'sc', // shipping charged to buyer
  ss: 'ss', // seller shipping cost
  cg: 'cg', // COGS
  tx: 'tx', // tax collected
  dc: 'dc', // discount %
  oa: 'oa', // offsite ads (etsy only) 0/1
};

export default function Page() {
  // ---------- state ----------
  const [platform, setPlatform] = useState<PlatformKey>('etsy');
  const [price, setPrice] = useState(120);
  const [shipCharge, setShipCharge] = useState(0);
  const [shipCost, setShipCost] = useState(10);
  const [cogs, setCogs] = useState(40);
  const [taxCollected, setTaxCollected] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [offsiteAds, setOffsiteAds] = useState(false); // NEW

  // ---------- read from URL once ----------
  useEffect(() => {
    const u = new URL(window.location.href);
    setPlatform((u.searchParams.get(Q.p) as PlatformKey) || 'etsy');
    setPrice(parseNum(u.searchParams.get(Q.pr), 120));
    setShipCharge(parseNum(u.searchParams.get(Q.sc), 0));
    setShipCost(parseNum(u.searchParams.get(Q.ss), 10));
    setCogs(parseNum(u.searchParams.get(Q.cg), 40));
    setTaxCollected(parseNum(u.searchParams.get(Q.tx), 0));
    setDiscountPct(parseNum(u.searchParams.get(Q.dc), 0));
    setOffsiteAds(parseNum(u.searchParams.get(Q.oa), 0) === 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- sync to URL ----------
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set(Q.p, platform);
    u.searchParams.set(Q.pr, String(price));
    u.searchParams.set(Q.sc, String(shipCharge));
    u.searchParams.set(Q.ss, String(shipCost));
    u.searchParams.set(Q.cg, String(cogs));
    u.searchParams.set(Q.tx, String(taxCollected));
    u.searchParams.set(Q.dc, String(discountPct));
    u.searchParams.set(Q.oa, String(offsiteAds ? 1 : 0));
    window.history.replaceState({}, '', u);
  }, [platform, price, shipCharge, shipCost, cogs, taxCollected, discountPct, offsiteAds]);

  // ---------- calculations ----------
  const res = useMemo(
    () =>
      calcAllFees(
        platform,
        price,
        shipCharge,
        shipCost,
        cogs,
        taxCollected,
        discountPct,
        { includeAds: platform === 'etsy' ? offsiteAds : false }
      ),
    [platform, price, shipCharge, shipCost, cogs, taxCollected, discountPct, offsiteAds]
  );

  // compare against all platforms (apply offsiteAds to Etsy only if toggle is on)
  const compare = useMemo(() => {
    return PLATFORMS.map((p) => {
      const r = calcAllFees(
        p.key,
        price,
        shipCharge,
        shipCost,
        cogs,
        taxCollected,
        discountPct,
        { includeAds: p.key === 'etsy' ? offsiteAds : false }
      );
      return { key: p.key, label: p.label, ...r };
    });
  }, [price, shipCharge, shipCost, cogs, taxCollected, discountPct, offsiteAds]);

  // ---------- UI ----------
  return (
    <main className="mx-auto max-w-6xl p-6 text-neutral-100">
      {/* header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-sm bg-purple-500" /> {/* purple square */}
          <h1 className="text-xl font-semibold">FeePilot</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="https://fee-pilot.vercel.app"
            className="rounded-lg border border-neutral-800 px-3 py-1 text-sm text-neutral-300 hover:border-purple-600 hover:text-neutral-100"
          >
            Share
          </a>
          <span className="rounded-lg border border-neutral-800 px-3 py-1 text-sm text-neutral-500">
            Pro
          </span>
        </div>
      </header>

      {/* top row */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Platform + last updated + optional ads toggle */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
          <div className="mb-3 text-sm text-neutral-300">Platform</div>
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

          <div className="mt-3 text-sm text-neutral-500">
            Rules last updated: <span className="text-neutral-300">{RULES[platform].lastUpdated}</span>
          </div>

          {platform === 'etsy' && (
            <div className="mt-4">
              <label className="flex items-center gap-2 text-neutral-300">
                <input
                  type="checkbox"
                  checked={offsiteAds}
                  onChange={(e) => setOffsiteAds(e.target.checked)}
                />
                Apply Offsite Ads
                <span className="text-xs text-neutral-500">
                  (uses {Math.round((RULES.etsy.adsPct ?? 0) * 100)}%)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* overview */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-neutral-300">Overview</span>
            <span className="text-sm text-neutral-300">Margin</span>
          </div>
          <div className="flex items-end justify-between">
            <div
              className={`text-4xl font-semibold ${
                res.net < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {fmtMoney(res.net)}
            </div>
            <div className="text-3xl text-neutral-200">
              {res.margin.toFixed(1)}%
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded bg-neutral-900">
            <div
              className={`h-full ${
                res.net < 0 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, Math.abs(res.margin)))}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* inputs */}
      <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumInput label="Item price ($)" value={price} onChange={setPrice} />
          <NumInput
            label="Shipping charged to buyer ($)"
            value={shipCharge}
            onChange={setShipCharge}
          />
          <NumInput
            label="Your shipping cost ($)"
            value={shipCost}
            onChange={setShipCost}
          />
          <NumInput label="Cost of goods ($)" value={cogs} onChange={setCogs} />
          <NumInput label="Tax collected ($)" value={taxCollected} onChange={setTaxCollected} />
          <NumInput label="Discount (%)" value={discountPct} onChange={setDiscountPct} right="%" />
        </div>
      </section>

      {/* breakdown */}
      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
          <div className="mb-3 text-sm text-neutral-300">Breakdown</div>
          <ul className="space-y-2 text-neutral-300">
            <li className="flex justify-between">
              <span>Subtotal (after discount + tax + ship to buyer)</span>
              <span className="text-neutral-100">{fmtMoney(res.discountedPrice + shipCharge + taxCollected)}</span>
            </li>
            <li className="flex justify-between">
              <span>Marketplace fee</span>
              <span className="text-neutral-100">{fmtMoney(res.marketplaceFee)}</span>
            </li>
            <li className="flex justify-between">
              <span>Payment fee</span>
              <span className="text-neutral-100">{fmtMoney(res.paymentFee)}</span>
            </li>
            {res.adsFee > 0 && (
              <li className="flex justify-between">
                <span>Offsite Ads</span>
                <span className="text-neutral-100">{fmtMoney(res.adsFee)}</span>
              </li>
            )}
            {res.listingFee > 0 && (
              <li className="flex justify-between">
                <span>Listing fee</span>
                <span className="text-neutral-100">{fmtMoney(res.listingFee)}</span>
              </li>
            )}
            <li className="flex justify-between">
              <span>Shipping cost (your cost)</span>
              <span className="text-neutral-100">{fmtMoney(res.shippingCost)}</span>
            </li>
            <li className="flex justify-between">
              <span>COGS</span>
              <span className="text-neutral-100">{fmtMoney(cogs)}</span>
            </li>
            <li className="mt-2 border-t border-neutral-800 pt-2 flex justify-between">
              <span>Total fees</span>
              <span className="text-neutral-100">{fmtMoney(res.totalFees)}</span>
            </li>
            <li className="flex justify-between font-semibold">
              <span>Net proceeds (after fees & COGS)</span>
              <span className={`${res.net < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmtMoney(res.net)}
              </span>
            </li>
          </ul>
        </div>

        {/* compare */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
          <div className="mb-3 text-sm text-neutral-300">
            Comparing with current inputs ({fmtMoney(price)} price, {fmtMoney(shipCharge)} ship charge, {fmtMoney(shipCost)} ship cost, {fmtMoney(cogs)} COGS, {discountPct}% discount, {fmtMoney(taxCollected)} tax).
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                  <th className="px-3 py-2 text-right">Total fees</th>
                  <th className="px-3 py-2 text-right">Marketplace fee</th>
                  <th className="px-3 py-2 text-right">Payment fee</th>
                  <th className="px-3 py-2 text-right">Listing fee</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr key={row.key} className="border-t border-neutral-900">
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-neutral-100 ${row.key === platform ? 'bg-purple-600/20 border border-purple-700' : 'bg-neutral-900 border border-neutral-800'}`}>
                        {row.label}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right ${row.net < 0 ? 'text-red-400' : ''}`}>
                      {fmtMoney(row.net)}
                    </td>
                    <td className="px-3 py-2 text-right">{row.margin.toFixed(1)}%</div></td>
                    <td className="px-3 py-2 text-right">{fmtMoney(row.totalFees)}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(row.marketplaceFee)}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(row.paymentFee)}</td>
                    <td className="px-3 py-2 text-right">{fmtMoney(row.listingFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="mt-10 text-center text-sm text-neutral-500">
        Made by <span className="text-purple-400">FeePilot</span>. Sporty Neon theme.
      </footer>
    </main>
  );
}
