'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import ResetButton from './ResetButton';
import CopiedToastHost from './CopiedToastHost';
import CopiedToast from './CopiedToast';
import ClearSavedDataButton from './ClearSavedDataButton';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';

export default function HeaderActions() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Theme */}
      <ThemeToggle />

      {/* Home-only: restore Clear saved data in the header */}
      {isHome ? <ClearSavedDataButton /> : null}

      {/* Reset (home) */}
      {isHome ? <ResetButton /> : null}

      {/* Share + Copy exist on home */}
      {isHome ? (
        <>
          <CopiedToastHost />
          <CopiedToast />
          {/* These two buttons are rendered by the home page; if they move in the future,
             leaving the placeholders here is harmless */}
        </>
      ) : null}

      {/* Pro link always available */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>
    </div>
  );
}
