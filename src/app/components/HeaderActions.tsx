'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  onShare: () => void | Promise<void>;
  onCopy: () => void | Promise<void>;
  className?: string;
};

export default function HeaderActions({ onShare, onCopy, className }: Props) {
  const pill =
    'rounded-full px-4 py-2 text-base select-none border ' +
    'border-purple-800/70 dark:border-purple-600/50 ' +
    'hover:bg-purple-50 dark:hover:bg-white/5';

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <button className={pill} onClick={onShare} aria-label="Share permalink">
        Share
      </button>
      <button className={pill} onClick={onCopy} aria-label="Copy permalink">
        Copy
      </button>
      {/* Link to the new Pro page */}
      <Link href="/pro" className={pill} aria-label="View Pro features">
        Pro
      </Link>
    </div>
  );
}
