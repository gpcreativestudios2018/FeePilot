import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fee Pilot Pro',
  description:
    'Pro features for Fee Pilot, including the reverse calculator to hit a target payout and more.',
  alternates: { canonical: '/pro' },
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
