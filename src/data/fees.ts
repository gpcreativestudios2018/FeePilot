// src/data/fees.ts

// ---------- types ----------

export type PlatformKey =
  | 'mercari'
  | 'ebay'
  | 'poshmark'
  | 'depop'
  | 'etsy'
  | 'grailed'
  | 'whatnot';

export type FeeRule = {
  /** % of item price (after any discount) that the marketplace takes */
  marketplacePct?: number;
  /** Flat marketplace fee (USD) added on top of the % fee, if any */
  marketplaceFixed?: number;
  /** % payment processing fee (applied to discounted item price) */
  paymentPct?: number;
  /** Flat payment fee (USD), if any */
  paymentFixed?: number;
  /** Optional note shown in tooltips, etc. */
  note?: string;
};

// ---------- UI: platforms list for the selector ----------

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'mercari', label: 'Mercari' },
  { key: 'ebay', label: 'eBay' },
  { key: 'poshmark', label: 'Poshmark' },
  { key: 'depop', label: 'Depop' },
  { key: 'etsy', label: 'Etsy' },
  { key: 'grailed', label: 'Grailed' },
  { key: 'whatnot', label: 'Whatnot' },
];

// ---------- Fee rules (simple, single-tier approximations) ----------
// These values are intentionally simple so the app compiles and runs.
// Adjust them as needed.

export const RULES: Record<PlatformKey, FeeRule> = {
  mercari: {
    marketplacePct: 10,
    paymentPct: 2.9,
    paymentFixed: 0.50,
    note: 'Marketplace 10%. Payment ~2.9% + $0.50.',
  },
  ebay: {
    // eBay varies by category; use a single blended rate for now
    marketplacePct: 13.25,
    paymentFixed: 0.30,
    note: 'Approx blended final value fee + $0.30 processing.',
  },
  poshmark: {
    // Poshmark is $2.95 under $15, and 20% otherwise; use 20% simple tier
    marketplacePct: 20,
    note: 'Simple 20% tier (flat $2.95 under $15 not modeled here).',
  },
  depop: {
    marketplacePct: 10,
    paymentPct: 3.0,
    paymentFixed: 0.30,
    note: 'Marketplace 10% + ~3% + $0.30 processing.',
  },
  etsy: {
    marketplacePct: 6.5, // transaction fee
    paymentPct: 3.0,
    paymentFixed: 0.25,
    note: '6.5% transaction + ~3% + $0.25 processing.',
  },
  grailed: {
    marketplacePct: 9,
    paymentPct: 3.49,
    note: 'Marketplace ~9% + ~3.49% processing.',
  },
  whatnot: {
    marketplacePct: 8,
    paymentPct: 2.9,
    paymentFixed: 0.30,
    note: 'Seller fee ~8% + 2.9% + $0.30 processing.',
  },
};

// ---------- “Rules last updated” stamp shown in the header ----------

export const RULES_UPDATED_AT = '2025-01-15';
