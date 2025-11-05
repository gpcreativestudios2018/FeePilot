'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';

type HeaderActionsProps = {
  /** Optional page-provided handler; we’ll fall back if it fails or isn’t present */
  onShare?: () => void | Promise<void>;
  /** Optional page-provided handler; we’ll fall back if it fails or isn’t present */
  onCopy?: () => void | Promise<void>;
};

export default function HeaderActions({ onShare, onCopy }: HeaderActionsProps) {
  const isHome = usePathname() === '/';
  const [copied, setCopied] = React.useState(false);

  const flashCopied = React.useCallback(() => {
    setCopied(true);
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, []);

  const safeCopy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flashCopied();
        return true;
      } catch {
        return false;
      }
    },
    [flashCopied]
  );

  const handleCopyClick = React.useCallback(async () => {
    // Prefer the page’s copy handler (e.g. copying a breakdown) if it exists
    if (onCopy) {
      try {
        await onCopy();
        flashCopied();
        return;
      } catch {
        // fall through to URL copy
      }
    }
    // Fallback: copy the shareable URL
    const url = window.location.href;
    await safeCopy(url);
  }, [onCopy, safeCopy, flashCopied]);

  const handleShareClick = React.useCallback(async () => {
    const url = window.location.href;
    const title = document?.title ?? 'Fee Pilot';

    // Use native Web Share if supported (type-safe without ts-expect-error)
    try {
      if (typeof navigator !== 'undefined') {
        const nav = navigator as unknown as {
          share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
        };
        if (typeof nav.share === 'function') {
          await nav.share({ title, url });
          return;
        }
      }
    } catch {
      // If native share throws (e.g. user cancels), just fall back.
    }

    // Fallback: copy the link (never hang)
    await safeCopy(url);
  }, [safeCopy]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Home-only actions */}
      {isHome && (
        <>
          <button type="button" onClick={handleShareClick} className={PILL_CLASS}>
            Share
          </button>
          <button type="button" onClick={handleCopyClick} className={PILL_CLASS}>
            Copy
          </button>
        </>
      )}

      {/* Pro link always visible */}
      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>

      {/* Lightweight local feedback so we don’t depend on a global toast host */}
      {copied ? (
        <span className={PILL_CLASS} aria-live="polite">
          Copied!
        </span>
      ) : null}
    </div>
  );
}
