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

/** Best-effort cleanup for any legacy/stuck share overlay */
function killStuckShareOverlay() {
  try {
    const candidates: Element[] = [];
    const byId = ['share-overlay', 'share-dialog', 'dialog-root', 'modal-root'];
    byId.forEach((id) => {
      const el = document.getElementById(id);
      if (el) candidates.push(el);
    });
    candidates.push(
      ...document.querySelectorAll(
        [
          '[role="dialog"]',
          '[aria-modal="true"]',
          '.fixed.inset-0',
          '.modal-backdrop',
          '.dialog-backdrop',
          '[data-spinner]',
          '.animate-spin',
        ].join(',')
      )
    );
    candidates.forEach((el) => {
      const cls = (el as HTMLElement).className?.toString() ?? '';
      const looksBackdrop =
        cls.includes('backdrop') || cls.includes('inset-0') || el.getAttribute('aria-busy') === 'true';
      const hasSpinner = !!el.querySelector?.('[aria-busy="true"], .animate-spin, [data-spinner]');
      if (looksBackdrop || hasSpinner) el.remove();
    });
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  } catch {
    /* noop */
  }
}

export default function HeaderActions({ onShare, onCopy }: HeaderActionsProps) {
  const isHome = usePathname() === '/';
  const [copied, setCopied] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

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
        // last-ditch: execCommand fallback
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

  const handleCopyClick = React.useCallback(async () => {
    if (onCopy) {
      try {
        await onCopy();
        flashCopied();
        return;
      } catch {
        // fall through
      }
    }
    await safeCopy(window.location.href);
  }, [onCopy, safeCopy, flashCopied]);

  const handleShareClick = React.useCallback(async () => {
    // clear anything stuck from old flow
    killStuckShareOverlay();
    setIsSharing(true);

    const url = window.location.href;
    const title = document?.title ?? 'Fee Pilot';

    // 2.5s timeout so we never hang
    const timeout = new Promise<never>((_, reject) => {
      const t = window.setTimeout(() => {
        window.clearTimeout(t);
        reject(new Error('share-timeout'));
      }, 2500);
    });

    const tryNativeShare = async () => {
      const nav = navigator as unknown as {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
        canShare?: (data?: { url?: string }) => boolean;
      };
      if (typeof nav.share === 'function') {
        if (!nav.canShare || nav.canShare({ url })) {
          await nav.share({ title, url });
          return true;
        }
      }
      return false;
    };

    try {
      const ok = await Promise.race([tryNativeShare(), timeout]);
      if (!ok) {
        await safeCopy(url);
      }
    } catch {
      await safeCopy(url);
    } finally {
      setIsSharing(false);
      // double-check and kill any stray spinner/backdrop
      window.setTimeout(killStuckShareOverlay, 200);
    }
  }, [safeCopy]);

  // also clean any stuck overlay on mount
  React.useEffect(() => {
    killStuckShareOverlay();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {isHome && (
        <>
          <button
            type="button"
            aria-busy={isSharing}
            onClick={handleShareClick}
            className={PILL_CLASS}
            disabled={isSharing}
          >
            {isSharing ? 'Sharing…' : 'Share'}
          </button>
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
