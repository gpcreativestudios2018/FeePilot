'use client';

import { useEffect, useState } from 'react';

type Props = {
  onShare: () => Promise<string>;  // should return the URL it copied
  onCopy: () => Promise<string>;   // idem (kept for symmetry if you later split actions)
  onReset: () => void;
};

export default function HeaderActions({ onShare, onCopy, onReset }: Props) {
  const [toast, setToast] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  // simple ephemeral toast helper
  const pop = (msg: string) => {
    setToast(msg);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 1500);
  };

  const handleShare = async () => {
    const url = await onShare();
    // copy (defensive – your onShare might already copy)
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    pop('Copied!');
  };

  const handleCopy = async () => {
    const url = await onCopy();
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    pop('Copied!');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Share */}
      <button
        onClick={handleShare}
        className="rounded-xl border border-neutral-700/80 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
        title="Copy a link to your current calculation"
      >
        Share
      </button>

      {/* Copy (kept separate if you want different behaviors later) */}
      <button
        onClick={handleCopy}
        className="rounded-xl border border-neutral-700/80 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
        title="Copy the current page link"
      >
        Copy
      </button>

      {/* Reset chip */}
      <button
        onClick={onReset}
        className="rounded-full border border-purple-500/70 px-3 py-1 text-xs font-medium text-purple-300 hover:bg-purple-950/40"
        title="Reset all inputs to defaults"
      >
        Reset
      </button>

      {/* Pro (disabled for now) */}
      <span
        className="ml-1 rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-sm text-neutral-400"
        title="Pro features are coming soon"
      >
        Pro <span className="text-neutral-500">(coming soon)</span>
      </span>

      {/* Tiny toast */}
      <div
        className={`pointer-events-none fixed right-4 top-3 select-none rounded-md border border-neutral-700/80 bg-neutral-900/90 px-3 py-1 text-sm text-neutral-100 shadow-lg transition-opacity ${
          showToast ? 'opacity-100' : 'opacity-0'
        }`}
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
