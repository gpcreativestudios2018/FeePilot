'use client';

import React from 'react';

type Props = {
  onShare: () => Promise<void> | void;
  onCopy: () => Promise<void> | void;
  /** If omitted, Pro is disabled and shows “coming soon”. */
  proHref?: string;
};

export default function HeaderActions({ onShare, onCopy, proHref }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onShare}
        className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/5"
      >
        Share
      </button>

      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/5"
      >
        Copy
      </button>

      {proHref ? (
        <a
          href={proHref}
          className="relative rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-violet-500/50 hover:ring-violet-400"
        >
          Pro
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="relative cursor-not-allowed rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-violet-500/60 text-violet-300/80"
          aria-disabled="true"
          title="Coming soon"
        >
          Pro
          <span className="ml-2 rounded-full bg-violet-600/40 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
            coming soon
          </span>
        </button>
      )}
    </div>
  );
}
