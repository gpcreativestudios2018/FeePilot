'use client';

import { useEffect, useRef, useState } from 'react';

// Reads from env so you don’t hardcode values.
// Vercel (Production): NEXT_PUBLIC_ADSENSE_CLIENT + NEXT_PUBLIC_ADSENSE_SLOT
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || '';

type AdsArray = unknown[] & { requestNonPersonalizedAds?: number };

export default function DocsAdSlot() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    const w = window as unknown as { adsbygoogle?: AdsArray };
    w.adsbygoogle = w.adsbygoogle || ([] as unknown as AdsArray);
    // Push a request — if Google decides not to fill, the holder still shows.
    try {
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    // Silent no-op if env vars aren’t present.
    return null;
  }

  return (
    <div
      ref={ref}
      className="my-8 rounded-md border border-gray-800/60"
      style={{
        // Provide a visible holder even if the ad hasn’t filled yet.
        padding: '12px',
        minHeight: mounted ? '120px' : '0px',
      }}
      suppressHydrationWarning
    >
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
