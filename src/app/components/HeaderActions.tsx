'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import CopiedToastHost from './CopiedToastHost';
import CopiedToast from './CopiedToast';
import { PILL_CLASS } from '@/lib/ui';

type HeaderActionsProps = {
  onShare?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
};

export default function HeaderActions({ onShare, onCopy }: HeaderActionsProps) {
  const isHome = usePathname() === '/';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Mount toast system on home so “Copied!” shows */}
      {isHome ? (
        <>
          <CopiedToastHost />
          <CopiedToast />
        </>
      ) : null}

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
    </div>
  );
}
