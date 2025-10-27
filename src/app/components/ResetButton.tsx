'use client';

import React from 'react';
import { PILL_CLASS } from '../../lib/ui';

type Props = { onClick: () => void; className?: string };

export default function ResetButton({ onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${PILL_CLASS} ${className ?? ''}`}
      aria-label="Reset inputs"
      title="Reset inputs"
    >
      Reset
    </button>
  );
}
