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

/** eBay category keys */
export type EbayCategoryKey = 'most' | 'clothing' | 'sneakers' | 'electronics' | 'books';

/** eBay category config */
export type EbayCategory = {
  name: string;
  marketplacePct: number;
};

/** StockX seller level keys */
export type StockXLevelKey = 'level1' | 'level2' | 'level3' | 'level4';

/** StockX seller level config */
export type StockXLevel = {
  name: string;
  marketplacePct: number;
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
  /** % offsite ads fee (Etsy-specific) */
  offsiteAdsPct?: number;
  /** Official source URL for fee information */
  sourceUrl?: string;
  /** Price threshold for tiered fees (e.g., Poshmark $15 threshold) */
  flatFeeThreshold?: number;
  /** Flat fee used when price is below threshold */
  flatFee?: number;
  /** eBay category-specific fees */
  categories?: Record<EbayCategoryKey, EbayCategory>;
  /** Default category key */
  defaultCategory?: EbayCategoryKey;
  /** StockX seller level fees */
  levels?: Record<StockXLevelKey, StockXLevel>;
  /** Default seller level key */
  defaultLevel?: StockXLevelKey;
  /** Default promoted listing % (for platforms that support it) */
  promotedPctDefault?: number;
  /** Date when fees were last verified (YYYY-MM-DD format) */
  lastVerified?: string;
};

export const RULES: Record<PlatformKey, FeeRule> = {
  etsy: {
    // Source: https://www.etsy.com/legal/fees/
    marketplacePct: 6.5,
    paymentPct: 3.0,
    paymentFixed: 0.25,
    listingFixed: 0.2,
    offsiteAdsPct: 15, // 15% for shops under $10k/year, 12% for $10k+
    promotedPctDefault: 10, // Etsy Ads: typically 1-30%, default 10%
    sourceUrl: 'https://www.etsy.com/legal/fees/',
    lastVerified: '2025-01-14',
  },
  stockx: {
    // Source: https://stockx.com/about/selling/
    levels: {
      level1: { name: 'Level 1', marketplacePct: 10 },
      level2: { name: 'Level 2', marketplacePct: 9.5 },
      level3: { name: 'Level 3', marketplacePct: 9 },
      level4: { name: 'Level 4', marketplacePct: 8 },
    },
    defaultLevel: 'level1',
    marketplacePct: 10, // fallback for comparison table
    paymentPct: 3,
    paymentFixed: 0,
    sourceUrl: 'https://stockx.com/about/selling/',
    lastVerified: '2025-01-14',
  },
  ebay: {
    // Source: https://www.ebay.com/sellercenter/selling/selling-fees
    categories: {
      most: { name: 'Most categories', marketplacePct: 13.25 },
      clothing: { name: 'Clothing & Accessories', marketplacePct: 12.9 },
      sneakers: { name: 'Sneakers (authenticated)', marketplacePct: 8.0 },
      electronics: { name: 'Electronics', marketplacePct: 14.6 },
      books: { name: 'Books & Media', marketplacePct: 14.6 },
    },
    defaultCategory: 'most',
    marketplacePct: 13.25, // fallback for comparison table
    paymentPct: 0,
    paymentFixed: 0.3,
    promotedPctDefault: 5, // eBay Promoted Listings: typically 2-15%, default 5%
    sourceUrl: 'https://www.ebay.com/sellercenter/selling/selling-fees',
    lastVerified: '2025-01-14',
  },
  depop: {
    // Source: https://www.depop.com/sellingfees/
    marketplacePct: 10,
    paymentPct: 3.3,
    paymentFixed: 0.45,
    sourceUrl: 'https://www.depop.com/sellingfees/',
    lastVerified: '2025-01-14',
  },
  mercari: {
    // Source: https://www.mercari.com/us/help_center/topics/selling/fees/
    marketplacePct: 10,
    paymentPct: 2.9,
    paymentFixed: 0.5,
    sourceUrl: 'https://www.mercari.com/us/help_center/topics/selling/fees/',
    lastVerified: '2025-01-14',
  },
  poshmark: {
    // Source: https://poshmark.com/posh_protect
    // Tiered: flat $2.95 under $15, 20% for $15+
    marketplacePct: 20,
    flatFeeThreshold: 15,
    flatFee: 2.95,
    paymentPct: 0,
    paymentFixed: 0,
    sourceUrl: 'https://poshmark.com/posh_protect',
    lastVerified: '2025-01-14',
  },
};

export const RULES_UPDATED_AT = '2025-01-14';
