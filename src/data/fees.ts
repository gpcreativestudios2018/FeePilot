// src/data/fees.ts

/* -----------------------------------------------------------
   FeePilot rule schema (easy to tweak per platform / region)
   NOTES:
   - Values are "baseline defaults" for fast iteration.
   - Tiers are progressive (first tier up to X, then next, etc.).
   - You can add min/max caps per tier if a platform has them.
   - Payment fees are applied to subtotal by default.
------------------------------------------------------------ */

export type PlatformKey = 'etsy' | 'stockx' | 'ebay' | 'poshmark' | 'depop' | 'mercari';

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'etsy', label: 'Etsy' },
  { key: 'stockx', label: 'StockX' },
  { key: 'ebay', label: 'eBay' },
  { key: 'depop', label: 'Depop' },
  { key: 'mercari', label: 'Mercari' },
  { key: 'poshmark', label: 'Poshmark' },
];

type Tier = {
  /** Rate as decimal (0.065 = 6.5%) */
  pct: number;
  /** Progressive tier ceiling; last tier can omit `upto` to be "remainder" */
  upto?: number;
  /** Optional min or max cap **for this tier’s portion** */
  min?: number;
  max?: number;
};

export type Rules = {
  /** Marketplace / final value fee tiers */
  marketplace: Tier[];
  /** Payment processing fee (applied to `baseForPayment`, usually subtotal) */
  payment?: {
    pct: number;
    fixed: number;
    /** Which base to apply to; default 'subtotal' */
    base?: 'subtotal' | 'priceOnly';
  };
  /** Flat listing fee per item/order (if any) */
  listingFixed?: number;
  /** ISO-ish date string for display */
  lastUpdated: string;
};

/** Clamp helper */
const clamp = (n: number, lo = -1e12, hi = 1e12) => Math.min(hi, Math.max(lo, n));

/** Apply progressive tiered fees to an amount */
export function applyTiered(amount: number, tiers: Tier[]): number {
  let remaining = amount;
  let acc = 0;

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const slice =
      typeof t.upto === 'number'
        ? clamp(Math.min(remaining, t.upto - (amount - remaining)), 0, amount)
        : remaining; // final tier covers remainder

    const fee = slice * t.pct;
    const feeCapped = Math.min(typeof t.max === 'number' ? t.max : Infinity, Math.max(typeof t.min === 'number' ? t.min : 0, fee));
    acc += feeCapped;

    remaining -= slice;
    if (remaining <= 0) break;
  }

  return acc;
}

/** Calculate all fee parts for a given platform & base amounts */
export function calcFees(
  r: Rules,
  {
    subtotal, // price - discount + tax + ship charged
    priceOnly,
  }: {
    subtotal: number;
    priceOnly: number;
  }
) {
  const marketplaceFee = applyTiered(subtotal, r.marketplace);

  // Payment fee base
  const baseForPayment =
    r.payment?.base === 'priceOnly' ? priceOnly : subtotal;

  const paymentFee = r.payment ? baseForPayment * r.payment.pct + r.payment.fixed : 0;
  const listingFee = r.listingFixed ?? 0;

  return {
    marketplaceFee,
    paymentFee,
    listingFee,
    totalFees: marketplaceFee + paymentFee + listingFee,
  };
}

/* -----------------------------------------------------------
   DEFAULT BASELINE RULES (tweak as needed)
   These are reasonable starting points; real platforms can vary
   by category, region, seller tier, promos, etc.
------------------------------------------------------------ */

export const RULES: Record<PlatformKey, Rules> = {
  etsy: {
    // Etsy transaction fee ~6.5% on item + shipping
    marketplace: [{ pct: 0.065 }],
    // Typical US payment processing ~3% + $0.25
    payment: { pct: 0.03, fixed: 0.25, base: 'subtotal' },
    // Listing fee per item
    listingFixed: 0.2,
    lastUpdated: '2025-10-16',
  },

  stockx: {
    // Seller fee baseline 10% (varies by level) – treat as single tier here
    marketplace: [{ pct: 0.1 }],
    // Processing ~3% (varies)
    payment: { pct: 0.03, fixed: 0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  ebay: {
    // Generic eBay final value baseline (category-agnostic).
    // Tiered example: 13% up to $7,500, then 2.35% remainder
    marketplace: [
      { pct: 0.13, upto: 7500 },
      { pct: 0.0235 }, // remainder
    ],
    // eBay usually includes processing inside final value fee; keep 0 here.
    payment: { pct: 0, fixed: 0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  poshmark: {
    // Flat model: under $15 -> $2.95; otherwise 20%
    // Implemented as tiers: first $15 has min $2.95 (makes it “flat” if small),
    // then remainder at 20%
    marketplace: [
      { pct: 0.0, upto: 15, min: 2.95 }, // ensures minimum for orders under $15
      { pct: 0.2 }, // remainder
    ],
    payment: { pct: 0, fixed: 0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  depop: {
    // Marketplace ~10%
    marketplace: [{ pct: 0.1 }],
    // Payment ~3% + $0.30 (Stripe/PayPal-ish)
    payment: { pct: 0.03, fixed: 0.3, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  mercari: {
    // Marketplace 10%
    marketplace: [{ pct: 0.1 }],
    // Payment / processing ~2.9% + $0.30
    payment: { pct: 0.029, fixed: 0.3, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },
};
