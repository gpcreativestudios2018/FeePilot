'use client';

import { useEffect, useRef, useState } from 'react';

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
    try {
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="my-8 rounded-md border border-gray-800/60"
      style={{ padding: '12px', minHeight: mounted ? '120px' : '0px' }}
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
