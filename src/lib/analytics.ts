// Mirrors events to Plausible and GA4. Safe in browsers without either script.
// GA is enabled only when NEXT_PUBLIC_GA_ID is present.

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

type EventProps = Record<string, unknown> | undefined;

function toGaEventName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_');
}

export function trackEvent(name: string, props?: EventProps) {
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible(name, props ? { props } : undefined);
    }
  } catch {
    // no-op
  }

  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_ID) {
      window.gtag('event', toGaEventName(name), props && typeof props === 'object' ? props : {});
    }
  } catch {
    // no-op
  }
}

export const track = trackEvent;
export const logEvent = trackEvent;

export function pageview(path?: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_ID) {
      const page_path =
        path ||
        (typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/');
      window.gtag('event', 'page_view', { page_path });
    }
  } catch {
    // no-op
  }
}

// Well-known events used around the app.
export const Events = {
  Share: 'Share',
  CopyLink: 'Copy Link',
  DownloadCSV: 'Download CSV',
  GetProClick: 'Get Pro Click',
  SupportClick: 'Support Click',
} as const;

export type KnownEvent = typeof Events[keyof typeof Events];

// Augment Window types (optional but handy)
declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}
