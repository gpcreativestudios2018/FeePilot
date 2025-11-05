'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';

type HeaderActionsProps = {
  onShare?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
};

/** Best-effort cleanup for any legacy/stuck share overlay */
function killStuckShareOverlay() {
  try {
    // Common patterns we may have used previously
    const candidates: Element[] = [];

    // Known ids/classes you might have in older builds
    const byId = ['share-overlay', 'share-dialog', 'dialog-root', 'modal-root'];
    byId.forEach((id) => {
      const el = document.getElementById(id);
      if (el) candidates.push(el);
    });

    // Generic fixed fullscreen dialog/backdrop patterns
    candidates.push(
      ...document.querySelectorAll(
        [
          '[role="dialog"]',
          '[aria-modal="true"]',
          '.fixed.inset-0', // common shadcn dialog/backdrop
          '.modal-backdrop',
          '.dialog-backdrop',
        ].join(',')
      )
    );

    // Remove only those that look like backdrops/spinners
    candidates.forEach((el) => {
      // Avoid nuking legitimate content: check for spinner/backdrop hints
      const looksLikeBackdrop =
        el.className?.toString().includes('backdrop') ||
        el.className?.toString().includes('inset-0') ||
        el.getAttribute('aria-busy') === 'true' ||
        el.querySelector('[aria-busy="true"], .animate-spin, [data-spinner]');

      if (looksLikeBackdrop) {
        el.remove();
      }
    });

    // Restore scrolling if it was blocked
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  } catch {
    // noop
  }
}

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
    // Try page-specific copy first
    if (onCopy) {
      try {
        await onCopy();
        flashCopied();
        return;
      } catch {
        // fall through
      }
    }
    // Fallback to copying current URL
    await safeCopy(window.location.href);
  }, [onCopy, safeCopy, flashCopied]);

  const handleShareClick = React.useCallback(async () => {
    // Proactively clear any previous overlay before starting
    killStuckShareOverlay();

    const url = window.location.href;
    const title = document?.title ?? 'Fee Pilot';

    try {
      const nav = navigator as unknown as {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      };
      if (typeof nav.share === 'function') {
        await nav.share({ title, url });
        return;
      }
    } catch {
      // ignore and fall back
    }

    // Fallback: just copy the link and show feedback
    await safeCopy(url);

    // Double-check a moment later in case something else mounted a spinner
    window.setTimeout(killStuckShareOverlay, 300);
  }, [safeCopy]);

  // Safety net: on mount, clean up any stuck overlay from prior navigations
  React.useEffect(() => {
    killStuckShareOverlay();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4">
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

      <Link href="/pro" className={PILL_CLASS}>
        Pro
      </Link>

      {copied ? (
        <span className={PILL_CLASS} aria-live="polite">
          Copied!
        </span>
      ) : null}
    </div>
  );
}
