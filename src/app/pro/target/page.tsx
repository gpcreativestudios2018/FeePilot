import type { Metadata } from 'next';
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
  // Enforce soft gate at the route level.
  // TargetGate unlocks with ?pro=1 and respects NEXT_PUBLIC_REQUIRE_PRO.
  return (
    <TargetGate>
      <TargetClient />
    </TargetGate>
  );
}
