'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ClientFooter() {
  const pathname = usePathname();
  // If Home already includes a footer, skip the layout footer to avoid duplicates.
  if (pathname === '/') return null;
  return <Footer />;
}
