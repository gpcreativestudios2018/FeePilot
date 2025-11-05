import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://fee-pilot.vercel.app';
const titleDefault = 'Fee Pilot – Marketplace Fee Calculator';
const description =
  'Fast, accurate marketplace fee calculator for Etsy, StockX, eBay, Depop, Mercari, and Poshmark. CSV export, shareable links, and Pro tools.';

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
