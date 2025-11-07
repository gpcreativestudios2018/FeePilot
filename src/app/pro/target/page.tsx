// src/app/pro/target/page.tsx
import type { Metadata } from 'next';
import TargetClient from './TargetClient';
import TargetGate from './TargetGate';

export const metadata: Metadata = {
  title: 'Reverse Calculator (beta) — Fee Pilot Pro',
  description:
    'Work backward from a target payout to find the required gross amount, accounting for platform and processor fees. Part of Fee Pilot Pro.',
  alternates: {
    canonical: '/pro/target',
  },
  openGraph: {
    title: 'Reverse Calculator (beta) — Fee Pilot Pro',
    description:
      'Start with a target payout and calculate the gross needed after fees. Great for quoting and planning.',
    url: '/pro/target',
    siteName: 'Fee Pilot',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TargetPage() {
  return (
    <TargetGate>
      <TargetClient />
    </TargetGate>
  );
}
