'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

/**
 * HeaderActions renders:
 * - (Home only) "Clear saved data" pill
 * - Always-visible "Pro" pill
 *
 * NOTE: This component intentionally accepts NO props.
 * Typing as React.FC ensures no external "Props" contract is required.
 */
const HeaderActions: React.FC = () => {
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
};

export default HeaderActions;
