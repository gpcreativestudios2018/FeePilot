'use client';

import { useEffect, useState } from 'react';

function getUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

// Minimal typing for Web Share API without using `any`
type ShareData = {
  title?: string;
  text?: string;
  url?: string;
};
type NavigatorWithShare = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

export default function HeaderActions() {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout | undefined;
    if (copied || shared) {
      t = setTimeout(() => {
        setCopied(false);
        setShared(false);
      }, 1500);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [copied, shared]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const doShare = async () => {
    const url = getUrl();
    const nav = (typeof navigator !== 'undefined'
      ? (navigator as NavigatorWithShare)
      : undefined);

    if (nav?.share) {
      try {
        await nav.share({ title: 'FeePilot', url });
        setShared(true);
        return;
      } catch {
        // If user cancels or share fails, we fall back to copy
      }
    }
    await doCopy();
  };

  const pill =
    'rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 transition active:scale-[0.98]';

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={doShare} className={pill} title="Share this page">
        {shared ? 'Shared!' : 'Share'}
      </button>

      <button type="button" onClick={doCopy} className={pill} title="Copy link">
        {copied ? 'Copied!' : 'Copy'}
      </button>

      {/* Pro — disabled, coming soon (no navigation) */}
      <button
        type="button"
        disabled
        title="Pro features are coming soon"
        className={`${pill} cursor-not-allowed opacity-60`}
        onClick={(e) => e.preventDefault()}
      >
        Pro <span className="ml-1 text-xs text-neutral-400">(coming soon)</span>
      </button>
    </div>
  );
}
