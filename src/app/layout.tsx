'use client';

import './globals.css';
import React from 'react';
import type { Metadata } from 'next';

const siteName = 'Fee Pilot';
const siteDescription =
  'Instant marketplace fee and profit calculator — including a reverse calculator to hit your target profit or margin.';
const siteUrl = 'https://fee-pilot.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: `${siteName} — marketplace fee calculator` },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
