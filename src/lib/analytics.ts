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
  } catch {}

  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_ID) {
      window.gtag('event', toGaEventName(name), props && typeof props === 'object' ? props : {});
    }
  } catch {}
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
  } catch {}
}

export const Events = {
  Share: 'Share',
  CopyLink: 'Copy Link',
  DownloadCSV: 'Download CSV',
  GetProClick: 'Get Pro Click',
  SupportClick: 'Support Click',
} as const;

export type KnownEvent = typeof Events[keyof typeof Events];
