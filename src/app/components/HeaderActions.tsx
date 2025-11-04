'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import ThemeToggle from './ThemeToggle';
import ClearSavedDataButton from './ClearSavedDataButton';
import { PILL_CLASS } from '@/lib/ui';

// Mirror the props ThemeToggle requires
type Props = {
  isLight: boolean;
  onToggle: () => void;
};

export default function HeaderActions({ isLight, onToggle }: Props) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Theme toggle (requires props) */}
      <ThemeToggle isLight={isLight} onToggle={onToggle} />

      {/* Home-only: Clear saved data pill back in the header */}
      {isHome ? <ClearSavedDataButton /> : null}

      {/* Pro link always visible */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>
    </div>
  );
}
