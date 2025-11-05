import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Marketplace Fee Calculator',
  description:
    'Calculate marketplace fees and seller earnings for Etsy, StockX, eBay, Depop, Mercari, and Poshmark. Includes accurate rules and clear breakdowns.',
};

export default function Page() {
  return <HomeClient />;
}
