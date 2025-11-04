'use client';

import React from 'react';
import { PILL_CLASS } from '@/lib/ui';

function ClearSavedDataPill() {
  const [flash, setFlash] = React.useState<string | null>(null);

  const clearLocal = React.useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('feepilot:') || k === 'feepilot:last-platform') {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
      setFlash('Cleared!');
      window.setTimeout(() => setFlash(null), 1500);
    } catch {
      setFlash('Failed');
      window.setTimeout(() => setFlash(null), 1500);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {flash ? (
        <span className={PILL_CLASS} aria-live="polite">
          {flash}
        </span>
      ) : (
        <button
          type="button"
          onClick={clearLocal}
          className={PILL_CLASS}
          title="Clear saved data (local presets, last platform)"
          aria-label="Clear saved data"
        >
          Clear saved data
        </button>
      )}
    </div>
  );
}

export default function RouteWidgets() {
  // TEMP: render everywhere to verify production bundle includes this widget.
  return <ClearSavedDataPill />;
}
