import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://fee-pilot.vercel.app';
const titleDefault = 'Fee Pilot – Poshmark Fee Calculator';
const description =
  'Fast, accurate Poshmark fee calculator and reverse calculator. Includes the $2.95 under-$15 rule, CSV export, and shareable links.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titleDefault,
    template: '%s · Fee Pilot',
  },
  description,
  keywords: [
    'Poshmark fees',
    'Poshmark calculator',
    'Poshmark reverse calculator',
    'marketplace fees',
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
      // Uses the dynamic OG endpoint (no file extension)
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'Fee Pilot' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: titleDefault,
    description,
    // Use the same dynamic endpoint
    images: ['/opengraph-image'],
    site: '@', // optional: your handle
    creator: '@', // optional: your handle
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico', // optional if you already have one
    // apple: '/apple-touch-icon.png', // optional, can add later
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
