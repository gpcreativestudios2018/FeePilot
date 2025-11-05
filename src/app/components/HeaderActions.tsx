'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

type HeaderActionsProps = {
  onShare?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
};

const CLEAR_KEYS = [
  // main calculator inputs + theme
  'feepilot:inputs',
  'feepilot:theme',
  // local preset namespaces (home + pro/target)
  'feepilot:presets',
  'feepilot:target-presets',
];

export default function HeaderActions({ onShare, onCopy }: HeaderActionsProps) {
  const isHome = usePathname() === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Home-only: Share / Copy */}
      {isHome && onShare ? (
        <button type="button" onClick={onShare} className={PILL_CLASS}>
          Share
        </button>
      ) : null}
      {isHome && onCopy ? (
        <button type="button" onClick={onCopy} className={PILL_CLASS}>
          Copy
        </button>
      ) : null}

      {/* Pro link always visible */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>

      {/* Home-only: Clear saved data (ensure it shows in prod even if page doesn’t render it) */}
      {isHome ? <ClearSavedDataButton keys={CLEAR_KEYS} /> : null}
    </div>
  );
}
