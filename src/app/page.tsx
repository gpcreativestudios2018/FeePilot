// src/app/page.tsx
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Fee Pilot — Fast fee calculator',
  description:
    'Estimate platform and payment processor fees, compare outcomes, export CSV, and share results. Free and privacy-friendly.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Fee Pilot — Fast fee calculator',
    description:
      'Quickly estimate fees, export CSV, and share results. Pro includes the Reverse Calculator (beta).',
    url: '/',
    siteName: 'Fee Pilot',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
