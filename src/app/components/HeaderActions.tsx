'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

const CLEAR_KEYS = [
  // Home inputs + theme
  'feepilot:inputs',
  'feepilot:theme',
  // Presets namespaces (home + pro/target)
  'feepilot:presets',
  'feepilot:target-presets',
];

export default function HeaderActions() {
  const isHome = usePathname() === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Home-only: Clear saved data pill in the header */}
      {isHome ? <ClearSavedDataButton keys={CLEAR_KEYS} /> : null}

      {/* Pro link always visible */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>
    </div>
  );
}
