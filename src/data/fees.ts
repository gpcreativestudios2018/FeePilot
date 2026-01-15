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
    // Source: https://www.etsy.com/legal/fees/
    marketplacePct: 6.5,
    paymentPct: 3.0,
    paymentFixed: 0.25,
    listingFixed: 0.2,
  },
  stockx: {
    // Source: https://stockx.com/about/selling/
    // Note: Fees decrease with seller level (Level 4 = 8% transaction)
    marketplacePct: 10,
    paymentPct: 3,
    paymentFixed: 0,
  },
  ebay: {
    // Source: https://www.ebay.com/sellercenter/selling/selling-fees
    marketplacePct: 13.25,
    paymentPct: 0,
    paymentFixed: 0.3,
  },
  depop: {
    // Source: https://www.depop.com/sellingfees/
    marketplacePct: 10,
    paymentPct: 3.3,
    paymentFixed: 0.45,
  },
  mercari: {
    // Source: https://www.mercari.com/us/help_center/topics/selling/fees/
    marketplacePct: 10,
    paymentPct: 2.9,
    paymentFixed: 0.5,
  },
  poshmark: {
    // Source: https://poshmark.com/posh_protect
    // Note: Flat $2.95 fee for sales under $15, 20% for $15+
    marketplacePct: 20,
    paymentPct: 0,
    paymentFixed: 0,
  },
};

export const RULES_UPDATED_AT = '2025-01-15';
