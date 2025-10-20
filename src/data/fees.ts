// src/data/fees.ts

// ---- Types ----
export type PlatformKey =
  | 'etsy'
  | 'stockx'
  | 'ebay'
  | 'depop'
  | 'mercari'
  | 'poshmark';

export type FeeRule = {
  /** Marketplace commission on order subtotal (item price – discounts + buyer-paid shipping) */
  marketplacePct: number;
  /** Payment processor % of order total (commonly item + shipping + tax) */
  paymentPct: number;
  /** Flat payment fee per order (USD) */
  paymentFixed: number;
  /** Listing or order fee (USD) */
  listingFee: number;
  /** Optional min/max caps for marketplace fees */
  minFee?: number;
  maxFee?: number;
  /** Optional human note */
  notes?: string;
};

// ---- “Last updated” stamp shown in the UI ----
export const RULES_UPDATED_AT = '2025-10-16';

// ---- Platform dropdown labels ----
export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'etsy', label: 'Etsy' },
  { key: 'stockx', label: 'StockX' },
  { key: 'ebay', label: 'eBay' },
  { key: 'depop', label: 'Depop' },
  { key: 'mercari', label: 'Mercari' },
  { key: 'poshmark', label: 'Poshmark' },
];

// ---- Fee rules (baseline defaults; we can tune by category/region later) ----
// These are conservative “typical” structures so the math works end-to-end.
// We’ll refine per-category and region once we gather official tables.
export const RULES: Record<PlatformKey, FeeRule> = {
  etsy: {
    // Etsy: ~6.5% marketplace fee; 3% + $0.25 payment; $0.20 listing
    marketplacePct: 0.065,
    paymentPct: 0.03,
    paymentFixed: 0.25,
    listingFee: 0.2,
    notes: 'Baseline Etsy calc (excludes offsite ads/promos).',
  },
  stockx: {
    // StockX varies by level; using a mid-tier 10% + 3% payment as a simple baseline
    marketplacePct: 0.10,
    paymentPct: 0.03,
    paymentFixed: 0.0,
    listingFee: 0.0,
    notes: 'Approx. mid-tier rates; refine by seller level later.',
  },
  ebay: {
    // eBay varies by category; use 13% marketplace, 0 paymentFixed
    marketplacePct: 0.13,
    paymentPct: 0.00, // eBay now bakes payment into final value fee for managed payments
    paymentFixed: 0.0,
    listingFee: 0.0,
    notes: 'Generic eBay managed payments baseline (category-dependent).',
  },
  depop: {
    // Depop: 10% marketplace; Stripe/PayPal ~2.9% + $0.29
    marketplacePct: 0.10,
    paymentPct: 0.029,
    paymentFixed: 0.29,
    listingFee: 0.0,
  },
  mercari: {
    // Mercari: 10% selling fee; 2.9% + $0.50 payment
    marketplacePct: 0.10,
    paymentPct: 0.029,
    paymentFixed: 0.50,
    listingFee: 0.0,
  },
  poshmark: {
    // Poshmark: $2.00 flat for <$15; 20% for >=$15 — modeled via marketplace % + minFee
    marketplacePct: 0.20,
    paymentPct: 0.0,
    paymentFixed: 0.0,
    listingFee: 0.0,
    minFee: 2.0,
    notes: '2.00 flat under $15; 20% otherwise (approximated).',
  },
};
// When you last verified the fee tables (displayed in the header)
export const RULES_UPDATED_AT = '2025-01-15';
