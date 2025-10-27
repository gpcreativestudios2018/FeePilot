'use client';

import React from 'react';

type Props = { onClick: () => void; className?: string };

export default function ResetButton({ onClick, className }: Props) {
  // Local pill style (no longer imported from HeaderActions)
  const pill =
    'rounded-full px-4 py-2 text-base select-none border ' +
    'border-purple-800/70 dark:border-purple-600/50 ' +
    'hover:bg-purple-50 dark:hover:bg-white/5';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${pill} ${className ?? ''}`}
      aria-label="Reset inputs"
      title="Reset inputs"
    >
      Reset
    </button>
  );
}
