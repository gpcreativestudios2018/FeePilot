import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Poshmark Fee Calculator',
  description:
    'Calculate Poshmark fees and seller earnings instantly. Includes the $2.95 flat fee under $15 and 20% otherwise.',
};

export default function Page() {
  return <HomeClient />;
}
