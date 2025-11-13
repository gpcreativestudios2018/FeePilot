import type { Metadata } from 'next';
import { Suspense } from 'react';
import TargetClient from './TargetClient';
import TargetGate from './TargetGate';

export const metadata: Metadata = {
  title: 'Reverse Calculator (Pro)',
  description:
    'Set a target take-home and instantly compute the required listing price (Pro feature).',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, noimageindex: true },
  },
  alternates: { canonical: '/pro/target' },
};

export default function Page() {
  // Wrap client hooks (useSearchParams inside TargetGate) with Suspense.
  return (
    <Suspense fallback={null}>
      <TargetGate>
        <TargetClient />
      </TargetGate>
    </Suspense>
  );
}
