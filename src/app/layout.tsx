import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ClientFooter from './components/ClientFooter';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';
const GCMP_URL = process.env.NEXT_PUBLIC_GCMP_URL || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://fee-pilot.vercel.app'),
  title: { default: 'Fee Pilot — Marketplace Fee Calculator', template: '%s — Fee Pilot' },
  description:
    'Fast, accurate marketplace fee calculator. Export CSV, share links, and estimate net profit. Reverse (Pro): target take-home calculator.',
  alternates: { canonical: '/' },
  robots: { googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    url: 'https://fee-pilot.vercel.app',
    title: 'Fee Pilot — Marketplace Fee Calculator',
    description: 'Fast, accurate marketplace fee calculator with CSV export and shareable links.',
    siteName: 'Fee Pilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fee Pilot — Marketplace Fee Calculator',
    description: 'Fast, accurate marketplace fee calculator with CSV export and shareable links.',
  },
  // This generates:
  // <meta name="google-site-verification" content="1DcR8BTQTm1Gtj2oqQtpmOIyPS82NU5lqsETG6E-MAA" />
  verification: {
    google: '1DcR8BTQTm1Gtj2oqQtpmOIyPS82NU5lqsETG6E-MAA',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
};

function AnalyticsProvider() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';

  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      try {
        if (window.gtag && typeof window.gtag === 'function' && GA_ID) {
          window.gtag('event', 'page_view', { page_path: `${pathname}${search}` });
        }
      } catch {}

      const sendPv = () => {
        if (window.gtag && typeof window.gtag === 'function' && GA_ID) {
          window.gtag('event', 'page_view', {
            page_path: `${window.location.pathname}${window.location.search}`,
          });
        }
      };

      const push = history.pushState.bind(history) as typeof history.pushState;
      const replace = history.replaceState.bind(history) as typeof history.replaceState;

      history.pushState = (data: unknown, title: string, url?: string | URL | null) => {
        push(data as unknown, title, url);
        sendPv();
      };
      history.replaceState = (data: unknown, title: string, url?: string | URL | null) => {
        replace(data as unknown, title, url);
        sendPv();
      };

      window.addEventListener('popstate', sendPv);
    });
  }

  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        {/* Footer hidden on "/" via ClientFooter to avoid duplicates */}
        <ClientFooter />

        {/* Plausible (prod only) */}
        {isProd && PLAUSIBLE_DOMAIN ? (
          <Script
            id="plausible"
            strategy="afterInteractive"
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}

        {/* Google CMP / Funding Choices (prod only via NEXT_PUBLIC_GCMP_URL) */}
        {isProd && GCMP_URL ? (
          <Script id="cmp-funding-choices" strategy="afterInteractive" src={GCMP_URL} />
        ) : null}

        {/* Google Analytics 4 (prod only via NEXT_PUBLIC_GA_ID) */}
        {isProd && GA_ID ? (
          <>
            <Script
              id="ga4-src"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){ dataLayer.push(arguments); }
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { send_page_view: false });
                `,
              }}
            />
            <AnalyticsProvider />
          </>
        ) : null}

        {/* Google AdSense (prod only) */}
        {isProd && ADSENSE_CLIENT ? (
          <>
            <Script
              id="adsense-src"
              strategy="afterInteractive"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
                ADSENSE_CLIENT,
              )}`}
              crossOrigin="anonymous"
            />
            <Script
              id="adsense-npa"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  try {
                    var w = window, n = navigator;
                    var dnt = (n && (n.doNotTrack === '1' || n.msDoNotTrack === '1')) || (w as any).doNotTrack === '1';
                    (w as any).adsbygoogle = (w as any).adsbygoogle || [];
                    (w as any).adsbygoogle.requestNonPersonalizedAds = 1;
                    if (dnt) (w as any).adsbygoogle.requestNonPersonalizedAds = 1;
                  } catch {}
                `,
              }}
            />
          </>
        ) : null}
      </body>
    </html>
  );
}

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: (unknown[] & { requestNonPersonalizedAds?: number });
  }
}
