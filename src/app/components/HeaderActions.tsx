'use client';

import React from 'react';
import Link from 'next/link';
import { PILL_CLASS } from '../../lib/ui';

type Props = {
  onShare: () => void | Promise<void>;
  onCopy: () => void | Promise<void>;
  className?: string;
};

export default function HeaderActions({ onShare, onCopy, className }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <button className={PILL_CLASS} onClick={onShare} aria-label="Share permalink">
        Share
      </button>
      <button className={PILL_CLASS} onClick={onCopy} aria-label="Copy permalink">
        Copy
      </button>
      <Link href="/pro" className={PILL_CLASS} aria-label="View Pro features">
        Pro
      </Link>
    </div>
  );
}
