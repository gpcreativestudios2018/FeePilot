'use client';

import React from 'react';
import { PILL_CLASS } from '../../lib/ui';

type Props = {
  isLight: boolean;
  onToggle: () => void;
  className?: string;
};

export default function ThemeToggle({ isLight, onToggle, className }: Props) {
  const label = isLight ? 'Dark mode' : 'Light mode';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${PILL_CLASS} ${className ?? ''}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {label}
    </button>
  );
}
