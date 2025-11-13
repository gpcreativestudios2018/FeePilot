'use client';

import { useEffect, useRef } from 'react';

// Reads from env so you don’t hardcode values.
// Add NEXT_PUBLIC_ADSENSE_SLOT in Vercel (Production) with your ad unit’s slot ID.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || '';

type AdsArray = unknown[] & { requestNonPersonalizedAds?: number };

/**
 * Lightweight AdSense box intended for docs pages only.
 * Renders nothing if required env vars are missing.
 */
export default function DocsAdSlot() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    const w = window as unknown as { adsbygoogle?: AdsArray };
    w.adsbygoogle = w.adsbygoogle || ([] as unknown as AdsArray);
    w.adsbygoogle.push({});
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    // Silent no-op in environments without ads configured.
    return null;
  }

  return (
    <div ref={ref} style={{ margin: '24px 0' }} suppressHydrationWarning>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
