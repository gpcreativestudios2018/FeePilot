export type PlatformKey = 'etsy' | 'stockx' | 'ebay' | 'poshmark' | 'depop' | 'mercari';

export type FeeRule = {
  marketplacePct: number;   // % of subtotal (0–1)
  paymentPct: number;       // % of subtotal (0–1)
  paymentFixed: number;     // flat $ per order
  listingFixed?: number;    // flat $ listing fee, if any
  lastUpdated: string;      // YYYY-MM-DD
  notes?: string;
};

export const RULES: Record<PlatformKey, FeeRule> = {
  etsy:    { marketplacePct: 0.065, paymentPct: 0.03,  paymentFixed: 0.25, listingFixed: 0.20, lastUpdated: '2025-10-16', notes: 'Approx starter rules; verify regions & taxes.' },
  stockx:  { marketplacePct: 0.10,  paymentPct: 0.03,  paymentFixed: 0.00,                     lastUpdated: '2025-10-16' },
  ebay:    { marketplacePct: 0.13,  paymentPct: 0.00,  paymentFixed: 0.00,                     lastUpdated: '2025-10-16' },
  poshmark:{ marketplacePct: 0.20,  paymentPct: 0.00,  paymentFixed: 0.00,                     lastUpdated: '2025-10-16' },
  depop:   { marketplacePct: 0.10,  paymentPct: 0.029, paymentFixed: 0.30,                     lastUpdated: '2025-10-16' },
  mercari: { marketplacePct: 0.10,  paymentPct: 0.029, paymentFixed: 0.30,                     lastUpdated: '2025-10-16' },
};

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: 'etsy', label: 'Etsy' },
  { key: 'stockx', label: 'StockX' },
  { key: 'ebay', label: 'eBay' },
  { key: 'poshmark', label: 'Poshmark' },
  { key: 'depop', label: 'Depop' },
  { key: 'mercari', label: 'Mercari' },
];
