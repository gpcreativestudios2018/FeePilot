'use client';

import React from 'react';

type Props = {
  /** localStorage keys to remove */
  keys: string[];
  /** optional: extra classNames to match surrounding buttons */
  className?: string;
  /** optional: called right after keys are cleared (before reload) */
  onCleared?: () => void;
  /** button label */
  children?: React.ReactNode;
};

export default function ClearSavedDataButton({
  keys,
  className,
  onCleared,
  children = 'Clear saved data',
}: Props) {
  const handleClick = () => {
    try {
      for (const k of keys) localStorage.removeItem(k);
    } catch {}
    try {
      onCleared?.();
    } finally {
      // Force a hard reload so the app re-inits with clean state
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Dev only: clear local saved inputs & theme"
      className={className}
    >
      {children}
    </button>
  );
}
