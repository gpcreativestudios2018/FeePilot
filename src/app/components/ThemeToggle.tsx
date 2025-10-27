'use client';

import React from 'react';

type Props = {
  isLight: boolean;
  onToggle: () => void;
  className?: string;
};

export default function ThemeToggle({ isLight, onToggle, className }: Props) {
  // Local pill style (no dependency on HeaderActions)
  const pill =
    'rounded-full px-4 py-2 text-base select-none border ' +
    'border-purple-800/70 dark:border-purple-600/50 ' +
    'hover:bg-purple-50 dark:hover:bg-white/5';

  const label = isLight ? 'Dark mode' : 'Light mode';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${pill} ${className ?? ''}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {label}
    </button>
  );
}
