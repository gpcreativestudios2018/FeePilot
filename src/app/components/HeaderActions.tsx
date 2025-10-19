'use client';

import { useEffect, useState } from 'react';

export default function HeaderActions() {
  const [copied, setCopied] = useState(false);

  // Copy current URL to clipboard
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  };

  // Use the Web Share API when available; fall back to copy
  const shareUrl = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FeePilot',
          text: 'Check out this FeePilot calculation',
          url: window.location.href,
        });
      } else {
        await copyUrl();
      }
    } catch {
      /* user canceled or unsupported */
    }
  };

  // Slight hover/press feedback for accessibility
  const btn =
    'rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500/60 active:scale-[.98] transition';

  // Prevent SSR hydration mismatch – only render on client
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <div className="relative flex items-center gap-2">
      <button type="button" className={btn} onClick={shareUrl}>
        Share
      </button>
      <button type="button" className={btn} onClick={copyUrl}>
        Copy
      </button>
      <a
        href="https://github.com/gpcreativestudios2018/FeePilot#pro"
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        Pro
      </a>

      {/* tiny toast for “email/url copied” style feedback */}
      {copied && (
        <div className="pointer-events-none absolute -bottom-9 right-0 rounded-md border border-purple-500/30 bg-neutral-950/90 px-2 py-1 text-xs text-purple-300 shadow-lg">
          Link copied
        </div>
      )}
    </div>
  );
}
