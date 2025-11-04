'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

// Some places may still import HeaderActions with a Props that includes fields like `keys`.
// Make everything optional so usage with `{}` compiles cleanly.
type Props = {
  isLight?: boolean;
  onToggle?: () => void;
  keys?: unknown;
};

export default function HeaderActions(_: Props) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Home-only: Clear saved data pill in the header */}
      {isHome ? <ClearSavedDataButton /> : null}

      {/* Pro link always visible */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>
    </div>
  );
}
