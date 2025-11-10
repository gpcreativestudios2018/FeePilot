import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Footer from './components/Footer';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://fee-pilot.vercel.app'),
  title: {
    default: 'Fee Pilot — Marketplace Fee Calculator',
    template: '%s — Fee Pilot',
  },
  description:
    'Fast, accurate marketplace fee calculator. Export CSV, share links, and estimate net profit. Reverse (Pro): target take-home calculator.',
  alternates: {
    canonical: '/',
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://fee-pilot.vercel.app',
    title: 'Fee Pilot — Marketplace Fee Calculator',
    description:
      'Fast, accurate marketplace fee calculator with CSV export and shareable links.',
    siteName: 'Fee Pilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fee Pilot — Marketplace Fee Calculator',
    description:
      'Fast, accurate marketplace fee calculator with CSV export and shareable links.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
};

function AnalyticsProvider() {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';
  const search =
    typeof window !== 'undefined' ? window.location.search : '';

  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      try {
        if (window.gtag && typeof window.gtag === 'function' && GA_ID) {
          window.gtag('event', 'page_view', {
            page_path: `${pathname}${search}`,
          });
        }
      } catch {
        // no-op
      }

      const sendPv = () => {
        if (window.gtag && typeof window.gtag === 'function' && GA_ID) {
          window.gtag('event', 'page_view', {
            page_path: `${window.location.pathname}${window.location.search}`,
          });
        }
      };

      // Safely wrap history methods without TS suppressions
      const originalPushState = history.pushState.bind(history);
      const originalReplaceState = history.replaceState.bind(history);

      (history as unknown as { pushState: (...args: any[]) => void }).pushState =
        (...args: any[]) => {
          originalPushState(...args);
          sendPv();
        };

      (history as unknown as { replaceState: (...args: any[]) => void }).replaceState =
        (...args: any[]) => {
          originalReplaceState(...args);
          sendPv();
        };

      window.addEventListener('popstate', sendPv);
    });
  }

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Footer />

        {/* Plausible (prod only) */}
        {isProd && PLAUSIBLE_DOMAIN ? (
          <Script
            id="plausible"
            strategy="afterInteractive"
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}

        {/* Google Analytics 4 (optional via NEXT_PUBLIC_GA_ID) */}
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
                  // Avoid double-counting; we send page_view manually.
                  gtag('config', '${GA_ID}', { send_page_view: false });
                `,
              }}
            />
            <AnalyticsProvider />
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
  }
}
