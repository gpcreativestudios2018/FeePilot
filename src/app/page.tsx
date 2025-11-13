import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Marketplace Fee Calculator',
  description:
    'Fast, accurate marketplace fee calculator. Export CSV, share links, and estimate net profit.',
  alternates: { canonical: '/' },
};

export default function Page() {
  // NOTE: The global <Footer /> is already rendered in layout.tsx.
  // Do not render a footer here to avoid duplicates.
  return <HomeClient />;
}
