'use client';

import React from 'react';

type Props = {
  onShare: () => Promise<void> | void;
  onCopy: () => Promise<void> | void;
  /** If provided, Pro links there. If omitted, shows “coming soon”. */
  proHref?: string;
};

export default function HeaderActions({ onShare, onCopy, proHref }: Props) {
  const baseBtn =
    'rounded-xl px-4 py-2 text-sm font-medium ring-2 ring-violet-500/60 hover:ring-violet-400/80 hover:bg-white/5 transition';

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onShare} className={baseBtn}>
        Share
      </button>

      <button type="button" onClick={onCopy} className={baseBtn}>
        Copy
      </button>

      {proHref ? (
        <a
          href={proHref}
          className="relative rounded-xl px-4 py-2 text-sm font-semibold ring-2 ring-violet-500/70 hover:ring-violet-400/90 transition"
        >
          Pro
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="relative cursor-not-allowed rounded-xl px-4 py-2 text-sm font-semibold ring-2 ring-violet-500/70 text-violet-300/90"
          aria-disabled="true"
          title="Coming soon"
        >
          Pro
          <span className="ml-2 rounded-full bg-violet-600/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
            coming soon
          </span>
        </button>
      )}
    </div>
  );
}
