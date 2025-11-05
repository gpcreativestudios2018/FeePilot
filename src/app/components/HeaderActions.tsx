'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

const CLEAR_KEYS = [
  'feepilot:inputs',
  'feepilot:theme',
  'feepilot:presets',
  'feepilot:target-presets',
];

// Accept the optional props the home page passes, even if we don't use them here.
type HeaderActionsProps = {
  onShare?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
};

export default function HeaderActions(_props: HeaderActionsProps) {
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
