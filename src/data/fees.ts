// src/data/fees.ts
// US-default fee rules. Supports tiers, caps/mins, listing fees, and optional ad fees (e.g., Etsy Offsite Ads).

export type PlatformKey = 'etsy' | 'stockx' | 'ebay' | 'poshmark' | 'depop' | 'mercari';

export type Tier = {
  pct: number;        // 0.065 = 6.5%
  upto?: number;      // apply this tier only up to this amount
  min?: number;       // minimum fee for this tier
  max?: number;       // maximum fee for this tier
};

export type Rules = {
  marketplace: Tier[]; // transaction/final value portion (can be tiered)
  payment?: {          // payment processing portion (pct + fixed)
    pct: number;
    fixed: number;
    base?: 'subtotal' | 'priceOnly'; // what we charge pct on
  };
  listingFixed?: number; // e.g., Etsy $0.20
  adsPct?: number;       // optional “offsite ads” pct; apply only if UI toggle enabled
  lastUpdated: string;
};

// ------- Defaults (US). We can add regions/categories/levels later. -------

export const RULES: Record<PlatformKey, Rules> = {
  etsy: {
    // Etsy US: 6.5% transaction; 3% + $0.25 processing; $0.20 listing; optional Offsite Ads ~12%
    marketplace: [{ pct: 0.065 }],
    payment: { pct: 0.03, fixed: 0.25, base: 'subtotal' },
    listingFixed: 0.2,
    adsPct: 0.12, // applied only if user toggles it on
    lastUpdated: '2025-10-16',
  },

  stockx: {
    // Simple general default: 10% marketplace + 3% processing
    marketplace: [{ pct: 0.10 }],
    payment: { pct: 0.03, fixed: 0.0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  ebay: {
    // General default (many categories): ~13% final value fee (processing bundled here for simplicity)
    marketplace: [{ pct: 0.13 }],
    payment: { pct: 0.0, fixed: 0.0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  poshmark: {
    // <$15 => flat $2.95; otherwise 20%
    marketplace: [
      { pct: 0, upto: 15, min: 2.95 },
      { pct: 0.20 },
    ],
    payment: { pct: 0, fixed: 0, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  mercari: {
    // Mercari US: 10% selling + 2.9% + $0.30 processing
    marketplace: [{ pct: 0.10 }],
    payment: { pct: 0.029, fixed: 0.30, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },

  depop: {
    // Many sellers currently see marketplace as effectively 0% (buyer pays service fee);
    // seller still pays processing. If you want historical 10%, change pct to 0.10.
    marketplace: [{ pct: 0.0 }],
    payment: { pct: 0.03, fixed: 0.30, base: 'subtotal' },
    lastUpdated: '2025-10-16',
  },
};

// ----- Helpers -----

export function calcTieredFee(amount: number, tiers: Tier[]): number {
  let remaining = amount;
  let total = 0;

  for (const t of tiers) {
    const chunk = typeof t.upto === 'number' ? Math.min(remaining, t.upto) : remaining;
    if (chunk <= 0) break;

    let fee = chunk * t.pct;
    if (typeof t.min === 'number') fee = Math.max(fee, t.min);
    if (typeof t.max === 'number') fee = Math.min(fee, t.max);

    total += fee;

    if (typeof t.upto === 'number') remaining -= chunk;
    else break;
  }
  return total;
}

/**
 * Calculate all fees + profit/margin.
 */
export function calcAllFees(
  platform: PlatformKey,
  price: number,
  buyerShippingCharge: number,
  sellerShippingCost: number,
  cogs: number,
  taxCollected: number,
  discountPct: number,
  opts?: { includeAds?: boolean }
) {
  const r = RULES[platform];

  const discountAmt = price * (discountPct / 100);
  const discountedPrice = Math.max(0, price - discountAmt);
  const subtotal = discountedPrice + buyerShippingCharge + taxCollected;

  // marketplace is typically on discounted price
  const marketplaceFee = calcTieredFee(discountedPrice, r.marketplace);

  // payment base
  const paymentBase = r.payment?.base === 'priceOnly' ? discountedPrice : subtotal;
  const paymentFee = r.payment ? paymentBase * r.payment.pct + r.payment.fixed : 0;

  // optional ads (e.g. Etsy offsite)
  const adsFee = opts?.includeAds && r.adsPct ? paymentBase * r.adsPct : 0;

  const listingFee = r.listingFixed ?? 0;

  const totalFees = marketplaceFee + paymentFee + adsFee + listingFee + sellerShippingCost;
  const net = discountedPrice - (totalFees + cogs);
  const margin = discountedPrice > 0 ? (net / discountedPrice) * 100 : 0;

  return {
    r,
    discountedPrice,
    marketplaceFee,
    paymentFee,
    adsFee,
    listingFee,
    shippingCost: sellerShippingCost,
    totalFees,
    net,
    margin,
  };
}

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'etsy', label: 'Etsy' },
  { key: 'stockx', label: 'StockX' },
  { key: 'ebay', label: 'eBay' },
  { key: 'poshmark', label: 'Poshmark' },
  { key: 'depop', label: 'Depop' },
  { key: 'mercari', label: 'Mercari' },
];
