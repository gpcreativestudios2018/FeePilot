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
export type EbayCategoryKey = 'most' | 'handbags_jewelry_watches' | 'guitars' | 'trading_cards_electronics' | 'books';

/** eBay category config */
export type EbayCategory = {
  name: string;
  marketplacePct: number;
};

/** StockX seller level keys */
export type StockXLevelKey = 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

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

/**
 * Fee rules for each platform.
 *
 * PAYMENT PROCESSING NOTES:
 * -------------------------
 * Payment processing fees vary by platform and region. The rates below are for US sellers.
 *
 * - Etsy: Payment processing (3% + $0.25) is the US rate via Etsy Payments.
 *   International rates vary: UK (4% + £0.20), EU (4% + €0.30), etc.
 *   All Etsy shops must use Etsy Payments in supported countries.
 *
 * - eBay: As of 2022, Managed Payments is mandatory for all sellers.
 *   Payment processing is now bundled into the Final Value Fee (no separate line item).
 *   The $0.30 fixed fee per order remains. International rates may vary.
 *
 * - Mercari: As of January 2026, payment processing fees were eliminated for sellers.
 *   Seller fee is a flat 10% marketplace fee only. Buyers pay a 3.6% protection fee separately.
 *
 * - Poshmark: Unique model - all fees are bundled into the flat/tiered structure.
 *   No separate payment processing fee. Poshmark handles payment internally.
 *
 * - StockX: Payment processing (3%) is separate from the seller level commission.
 *   Both buyer and seller pay fees on StockX.
 *
 * - Depop: Payment processing (3.3% + $0.45) is for Depop Payments (US).
 *   PayPal transactions may have different rates.
 */
export const RULES: Record<PlatformKey, FeeRule> = {
  etsy: {
    // Source: https://www.etsy.com/legal/fees/
    // Payment processing: 3% + $0.25 is the US rate via Etsy Payments.
    // International rates vary by country (UK: 4% + £0.20, EU: 4% + €0.30, etc.)
    marketplacePct: 6.5,
    paymentPct: 3.0,
    paymentFixed: 0.25,
    listingFixed: 0.2,
    offsiteAdsPct: 15, // 15% for shops under $10k/year, 12% for $10k+
    promotedPctDefault: 10, // Etsy Ads: typically 1-30%, default 10%
    sourceUrl: 'https://www.etsy.com/legal/fees/',
    lastVerified: '2026-03-13',
  },
  stockx: {
    // Source: https://stockx.com/about/selling/
    // Flex fulfillment fee ($5) removed March 2026; Flex fees increased by 2% across all levels.
    // Standard (non-Flex) seller shipping fee is $5 US. Payment processing 3% is separate.
    levels: {
      level1: { name: 'Level 1', marketplacePct: 9 },
      level2: { name: 'Level 2', marketplacePct: 8.5 },
      level3: { name: 'Level 3', marketplacePct: 8 },
      level4: { name: 'Level 4', marketplacePct: 7.5 },
      level5: { name: 'Level 5', marketplacePct: 7 },
    },
    defaultLevel: 'level1',
    marketplacePct: 9, // fallback for comparison table
    paymentPct: 3,
    paymentFixed: 0,
    sourceUrl: 'https://stockx.com/about/selling/',
    lastVerified: '2026-03-13',
  },
  ebay: {
    // Source: https://www.ebay.com/sellercenter/selling/selling-fees (2026 rates)
    // IMPORTANT: As of 2022, Managed Payments is mandatory for all eBay sellers.
    // Payment processing is now bundled into the Final Value Fee - no separate % line item.
    // The category percentages below already include payment processing.
    categories: {
      most: { name: 'Most categories', marketplacePct: 13.6 },
      handbags_jewelry_watches: { name: 'Handbags, Jewelry & Watches', marketplacePct: 15 },
      guitars: { name: 'Guitars & Basses', marketplacePct: 6.6 },
      trading_cards_electronics: { name: 'Trading Cards & Electronics', marketplacePct: 13.6 },
      books: { name: 'Books, DVDs & Music', marketplacePct: 14.6 },
    },
    defaultCategory: 'most',
    marketplacePct: 13.6, // fallback for comparison table
    paymentPct: 0, // bundled into Final Value Fee (Managed Payments)
    paymentFixed: 0.4, // $0.40 per-order fee for orders >$10 (most common case); $0.30 for orders ≤$10
    promotedPctDefault: 5, // eBay Promoted Listings: typically 2-15%, default 5%
    sourceUrl: 'https://www.ebay.com/sellercenter/selling/selling-fees',
    lastVerified: '2026-03-13',
  },
  depop: {
    // Source: https://www.depop.com/sellingfees/
    // As of July 2024, Depop removed the 10% selling fee for US and UK sellers on new/updated listings.
    // International sellers still pay 10%. Only payment processing fees apply for US/UK sellers.
    marketplacePct: 0,
    paymentPct: 3.3,
    paymentFixed: 0.45,
    sourceUrl: 'https://www.depop.com/sellingfees/',
    lastVerified: '2026-03-13',
  },
  mercari: {
    // Source: https://www.mercari.com/us/help_center/topics/selling/fees/
    // As of January 2026, Mercari eliminated payment processing fees for sellers.
    // Buyers pay a 3.6% protection fee separately. Seller fee is a flat 10%.
    marketplacePct: 10,
    paymentPct: 0,
    paymentFixed: 0,
    sourceUrl: 'https://www.mercari.com/us/help_center/topics/selling/fees/',
    lastVerified: '2026-03-13',
  },
  poshmark: {
    // Source: https://poshmark.com/posh_protect
    // Tiered: flat $2.95 under $15, 20% for $15+
    // Unique model: ALL fees are bundled into the flat/tiered structure.
    // No separate payment processing fee - Poshmark handles payments internally.
    // This is why paymentPct and paymentFixed are both 0.
    marketplacePct: 20,
    flatFeeThreshold: 15,
    flatFee: 2.95,
    paymentPct: 0, // bundled into Poshmark's fee structure
    paymentFixed: 0, // no separate payment fee
    sourceUrl: 'https://poshmark.com/posh_protect',
    lastVerified: '2026-03-13',
  },
};

export const RULES_UPDATED_AT = '2026-03-13';
