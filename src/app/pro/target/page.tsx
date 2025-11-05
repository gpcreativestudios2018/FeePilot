import type { Metadata } from 'next';
import TargetClient from './TargetClient';

export const metadata: Metadata = {
  title: 'Reverse Poshmark Calculator (Target Payout)',
  description:
    'Enter your desired payout and get the exact listing price for Poshmark, with the $2.95 under-$15 flat fee and 20% otherwise handled automatically.',
  alternates: { canonical: '/pro/target' },
};

export default function Page() {
  return <TargetClient />;
}
