// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

const siteUrl = 'https://fee-pilot.vercel.app';
const titleDefault = 'Fee Pilot — Marketplace Fee Calculator';
const description =
  'Fast, accurate marketplace fee calculator for Etsy, StockX, eBay, Depop, Mercari, and Poshmark. CSV export, shareable links, and Pro tools.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titleDefault,
    template: '%s · Fee Pilot',
  },
  description,
  keywords: [
    'marketplace fees',
    'fee calculator',
    'etsy fees',
    'stockx fees',
    'ebay fees',
    'depop fees',
    'mercari fees',
    'poshmark fees',
    'seller tools',
  ],
  authors: [{ name: 'Fee Pilot' }],
  creator: 'Fee Pilot',
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Fee Pilot',
    title: titleDefault,
    description,
    images: [
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'Fee Pilot' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: titleDefault,
    description,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set and we're in production, inject Plausible.
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const isProd =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {plausibleDomain && isProd && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
