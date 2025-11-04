'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Home-only helper that:
 * - Finds the legacy header "Clear saved data" button that used to have a "dev only" tooltip
 * - Replaces its title/aria-label with a clean string
 * - Renders nothing (so no bottom-right pill)
 */
export default function RouteWidgets() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname !== '/') return;
    try {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('button[title],a[title],*[title]')
      );
      for (const el of candidates) {
        const title = (el.getAttribute('title') || '').toLowerCase();
        // Match the old tooltip and clean it up
        if (title.includes('dev') && title.includes('clear')) {
          el.setAttribute('title', 'Clear saved data');
          el.setAttribute('aria-label', 'Clear saved data');
        }
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  // No UI — just patch the old tooltip and exit
  return null;
}
