'use client';

import { useMemo, useState } from 'react';

type PlatformKey = 'etsy' | 'stockx' | 'ebay' | 'poshmark' | 'depop' | 'mercari';

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'etsy', label: 'Etsy' },
  { key: 'stockx', label: 'StockX' },
  { key: 'ebay', label: 'eBay' },
  { key: 'poshmark', label: 'Poshmark' },
  { key: 'depop', label: 'Depop' },
  { key: 'mercari', label: 'Mercari' },
];

// TEMP rules (placeholders). We’ll move these to fees.json later.
const TEMP_RULES: Record<PlatformKey, { marketplacePct: number; paymentPct: number; paymentFixed: number; listingFixed?: number }> = {
  etsy:    { marketplacePct: 0.065, paymentPct: 0.03, paymentFixed: 0.25, listingFixed: 0.2 },
  stockx:  { marketplacePct: 0.10,  paymentPct: 0.03, paymentFixed: 0.00 },
  ebay:    { marketplacePct: 0.13,  paymentPct: 0.00, paymentFixed: 0.00 },
  poshmark:{ marketplacePct: 0.20,  paymentPct: 0.00, paymentFixed: 0.00 },
  depop:   { marketplacePct: 0.10,  paymentPct: 0.029, paymentFixed: 0.30 },
  mercari: { marketplacePct: 0.10,  paymentPct: 0.029, paymentFixed: 0.30 },
};

export default function Page() {
  const [platform, setPlatform] = useState<PlatformKey>('etsy');
  const [price, setPrice] = useState<number>(120);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(10);
  const [cogs, setCogs] = useState<number>(40);
  const [taxCollected, setTaxCollected] = useState<number>(0);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [targetProfit, setTargetProfit] = useState<number>(50);

  const {
    subtotal,
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees,
    netProceeds,
    profit,
    marginPct,
    requiredPriceForTarget,
  } = useMemo(() => {
    const r = TEMP_RULES[platform];
    const discounted = price * (1 - discountPct / 100);
    const subtotal = discounted + shippingCharge + taxCollected;

    const marketplaceFee = subtotal * r.marketplacePct;
    const paymentFee = subtotal * r.paymentPct + r.paymentFixed;
    const listingFee = r.listingFixed ?? 0;

    const totalFees = marketplaceFee + paymentFee + listingFee;
    const netProceeds = subtotal - totalFees - shippingCost;
    const profit = netProceeds - cogs;
    const marginPct = subtotal > 0 ? (profit / subtotal) * 100 : 0;

    // Backsolve: price needed to hit targetProfit (rough, ignores taxes/discount toggle nuances for now)
    const requiredPriceForTarget = (() => {
      const t = targetProfit + cogs + shippingCost;
      // subtotal = price*(1-d) + shippingCharge + taxCollected
      // fees = subtotal*(m+p) + paymentFixed + listingFixed
      const d = discountPct / 100;
      const k = (1 - d) * (1 - (r.marketplacePct + r.paymentPct));
      if (k <= 0.0001) return NaN;
      const fixed = shippingCharge + taxCollected - (r.paymentFixed + (r.listingFixed ?? 0));
      return (t - fixed) / k;
    })();

    return {
      subtotal,
      marketplaceFee,
      paymentFee,
      listingFee,
      totalFees,
      netProceeds,
      profit,
      marginPct,
      requiredPriceForTarget,
    };
  }, [platform, price, shippingCharge, shippingCost, cogs, taxCollected, discountPct, targetProfit]);

  const currency = (n: number) =>
    isFinite(n) ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight">
            <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300">●</span>{' '}
            FeePilot
          </div>
          <button className="rounded-lg border border-cyan-500/40 px-4 py-2 text-cyan-300 hover:bg-cyan-500/10">
            Pro
          </button>
        </div>
      </header>

      {/* Main split panel */}
      <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Inputs */}
        <section className="space-y-4">
          <Card title="Platform">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformKey)}
              className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-cyan-400"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Card>

          <Card title="Inputs">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Item price ($)" value={price} setValue={setPrice} />
              <NumberField label="Shipping charged to buyer ($)" value={shippingCharge} setValue={setShippingCharge} />
              <NumberField label="Your shipping cost ($)" value={shippingCost} setValue={setShippingCost} />
              <NumberField label="Cost of goods ($)" value={cogs} setValue={setCogs} />
              <NumberField label="Tax collected ($)" value={taxCollected} setValue={setTaxCollected} />
              <NumberField label="Discount (%)" value={discountPct} setValue={setDiscountPct} />
            </div>
          </Card>

          <Card title="Backsolve">
            <div className="grid grid-cols-2 gap-3 items-end">
              <NumberField label="Target profit ($)" value={targetProfit} setValue={setTargetProfit} />
              <div className="text-sm text-white/70">Required price: <span className="font-semibold text-cyan-300">{currency(requiredPriceForTarget)}</span></div>
            </div>
          </Card>
        </section>

        {/* Right: Results */}
        <section className="space-y-4 md:sticky md:top-16 self-start">
          <Card title="Overview" highlight>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm text-white/60">Profit</div>
                <div className={`text-3xl font-semibold ${profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {currency(profit)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Margin</div>
                <div className="text-2xl font-semibold">{isFinite(marginPct) ? `${marginPct.toFixed(1)}%` : '—'}</div>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded bg-white/10">
              <div
                className={`h-2 rounded ${profit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.min(100, Math.max(0, Math.abs(marginPct)))}%` }}
              />
            </div>
          </Card>

          <Card title="Breakdown">
            <ul className="space-y-2 text-sm">
              <Row label="Subtotal (after discount + tax + ship to buyer)" value={currency(subtotal)} />
              <Row label="Marketplace fee" value={currency(marketplaceFee)} />
              <Row label="Payment fee" value={currency(paymentFee)} />
              {listingFee > 0 && <Row label="Listing fee" value={currency(listingFee)} />}
              <Row label="Shipping cost (your cost)" value={currency(shippingCost)} />
              <Row label="COGS" value={currency(cogs)} />
              <hr className="border-white/10 my-2" />
              <Row label="Total fees" value={currency(totalFees)} />
              <Row label="Net proceeds (after fees & ship cost)" value={currency(netProceeds)} />
            </ul>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-white/50">
        Made by <span className="text-cyan-300 font-medium">FeePilot</span>. Sporty Neon theme.
      </footer>
    </div>
  );
}

function Card({
  title,
  children,
  highlight = false,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 p-4 ${highlight ? 'bg-cyan-500/5' : 'bg-white/5'}`}>
      <div className="mb-3 text-sm font-semibold tracking-wide text-white/80">{title}</div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-white/70">{label}</div>
      <input
        type="number"
        step="0.01"
        value={isNaN(value) ? '' : value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full rounded-lg bg-black/40 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-cyan-400"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
