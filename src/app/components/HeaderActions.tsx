'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';

type HeaderActionsProps = {
  onShare?: () => void | Promise<void>; // (kept for compatibility; not used)
  onCopy?: () => void | Promise<void>;
};

export default function HeaderActions({ onCopy }: HeaderActionsProps) {
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
        try {
          const el = document.createElement('input');
          el.value = text;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          flashCopied();
          return true;
        } catch {
          return false;
        }
      }
    },
    [flashCopied]
  );

  // One-click copy for both buttons: "Share" (renamed behavior) and "Copy"
  const handleCopyClick = React.useCallback(async () => {
    // Prefer page-provided copy logic if present
    if (onCopy) {
      try {
        await onCopy();
        flashCopied();
        return;
      } catch {
        /* fall through */
      }
    }
    // Fallback to copying current URL
    await safeCopy(window.location.href);
  }, [onCopy, safeCopy, flashCopied]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {isHome && (
        <>
          {/* Share now just copies the link (no Web Share, no spinner) */}
          <button type="button" onClick={handleCopyClick} className={PILL_CLASS}>
            {copied ? 'Copied!' : 'Share'}
          </button>

          {/* Copy keeps its original label but same behavior */}
          <button type="button" onClick={handleCopyClick} className={PILL_CLASS}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </>
      )}

      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>
    </div>
  );
}
