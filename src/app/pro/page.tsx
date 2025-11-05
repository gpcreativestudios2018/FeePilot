import type { Metadata } from 'next';
import ProClient from './ProClient';

export const metadata: Metadata = {
  title: 'Fee Pilot Pro',
  description: 'Unlock power features for sellers. Pro adds reverse calculator and more.',
  alternates: { canonical: '/pro' },
};

export default function Page() {
  return <ProClient />;
}
