// src/data/fees.ts

export type PlatformKey =
  | 'etsy'
  | 'stockx'
  | 'ebay'
  | 'depop'
  | 'mercari'
  | 'poshmark';

/**
 * Default platform order used across the app:
 * - Start with popular handmade / social marketplaces
 * - Then general marketplaces
 * - Then sneakers
 */
export const PLATFORMS: PlatformKey[] = [
  'etsy',
  'depop',
  'mercari',
  'poshmark',
  'ebay',
  'stockx',
];

/** Human-friendly labels for each platform (for selects, tables, etc.) */
export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  etsy: 'Etsy',
  stockx: 'StockX',
  ebay: 'eBay',
  depop: 'Depop',
  mercari: 'Mercari',
  poshmark: 'Poshmark',
};

export type FeeRule = {
  /** % of (discounted price + shipping charged to buyer) */
  marketplacePct?: number;
  /** flat fee added by the marketplace */
  marketplaceFixed?: number;
  /** % payment processing fee on the same base */
  paymentPct?: number;
  /** flat payment processing fee */
  paymentFixed?: number;
  /** flat listing fee (per listing/order) */
  listingFixed?: number;
};

export const RULES: Record<PlatformKey, FeeRule> = {
  etsy: {
    marketplacePct: 6.5,
    paymentPct: 3.0, // tune these numbers to your latest reference
    paymentFixed: 0.85,
    listingFixed: 0.2, // Etsy has a $0.20 listing fee
  },
  stockx: {
    marketplacePct: 10, // example
    paymentPct: 3,
    paymentFixed: 0.6,
  },
  ebay: {
    marketplacePct: 12, // example
    paymentPct: 0,
    paymentFixed: 0,
  },
  depop: {
    marketplacePct: 10, // example
    paymentPct: 2.9,
    paymentFixed: 0.5,
  },
  mercari: {
    marketplacePct: 10, // example: marketplace fee
    paymentPct: 2.9,
    paymentFixed: 0.5,
  },
  poshmark: {
    // Poshmark often acts like flat $2.95 under $15 / 20% above; this is a simple placeholder.
    marketplacePct: 20,
    paymentPct: 0,
    paymentFixed: 0,
  },
};

export const RULES_UPDATED_AT = '2025-01-15';
