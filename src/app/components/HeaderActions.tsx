'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

// Accept arbitrary props from parent without using `any`
type Props = Record<string, unknown>;

export default function HeaderActions(props: Props) {
  // Mark props as intentionally unused to satisfy eslint
  void props;

  const isHome = usePathname() === '/';

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
