// src/app/pro/page.tsx
import type { Metadata } from 'next';
import ProClient from './ProClient';

export const metadata: Metadata = {
  title: 'Pro — Fee Pilot',
  description:
    'Explore Fee Pilot Pro: advanced tools for fee analysis, including the Reverse Calculator (beta), CSV export, and shareable results.',
  alternates: {
    canonical: '/pro',
  },
  openGraph: {
    title: 'Fee Pilot Pro',
    description:
      'Advanced fee analysis with Pro: work backward from targets, compare outcomes, and streamline your workflow.',
    url: '/pro',
    siteName: 'Fee Pilot',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProPage() {
  return <ProClient />;
}
