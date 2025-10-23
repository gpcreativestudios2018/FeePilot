// src/app/components/HeaderActions.tsx
"use client";

import React from "react";

export const actionButtonClass =
  "rounded-full border border-purple-600/60 px-4 py-2 text-sm leading-6 transition " +
  "hover:bg-purple-600/10 active:scale-[.98] cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60";

const disabledButtonClass =
  "rounded-full border border-purple-600/60 px-4 py-2 text-sm leading-6 " +
  "cursor-not-allowed select-none opacity-90 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60";

type Props = {
  onShare: () => Promise<void>;
  onCopy: () => Promise<void>;
};

export default function HeaderActions({ onShare, onCopy }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={actionButtonClass} onClick={onShare}>
        Share
      </button>
      <button type="button" className={actionButtonClass} onClick={onCopy}>
        Copy
      </button>

      {/* Pro: disabled pill with not-allowed cursor */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Pro is coming soon"
        className={disabledButtonClass + " flex items-center gap-2"}
      >
        <span>Pro</span>
        <span className="rounded-full bg-purple-600/50 px-2 py-0.5 text-xs">
          coming soon
        </span>
      </button>
    </div>
  );
}
