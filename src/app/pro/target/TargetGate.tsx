'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackEvent, Events } from '@/src/lib/analytics';

const REQUIRE_PRO = (process.env.NEXT_PUBLIC_REQUIRE_PRO || '') === '1';
const CHECKOUT_URL = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || '';

type Route =
  | '/'
  | '/about'
  | '/docs'
  | '/pro'
  | '/pro/target';

export default function TargetGate({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const unlockedViaQuery = useMemo(() => params?.get('pro') === '1', [params]);

  // Gate logic:
  // - If NOT requiring Pro (env off), allow.
  // - If query provides ?pro=1, allow.
  // - Otherwise, block and show upsell.
  const allow = !REQUIRE_PRO || unlockedViaQuery;

  if (allow) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Reverse Calculator (Pro)</h1>
      <p className="mt-3 text-gray-700">
        This feature is part of <strong>Fee Pilot Pro</strong>. Unlock it to work backward from a target take-home and
        instantly compute the required listing price.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {CHECKOUT_URL ? (
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm bg-black text-white hover:opacity-90"
            onClick={() => trackEvent(Events.GetProClick)}
          >
            Get Pro
          </a>
        ) : null}

        {/* IMPORTANT: Do NOT unlock. This guides legitimate buyers without bypassing. */}
        <Link
          href={'/pro' as Route}
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50"
          onClick={() => trackEvent(Events.SupportClick)}
        >
          I already purchased
        </Link>
      </div>

      <div className="mt-6 text-sm text-gray-600" suppressHydrationWarning>
        <p>
          Already purchased? Open your <strong>Pro access link</strong> (it includes <code>?pro=1</code>) or contact
          support from the Pro page. For privacy, we don’t auto-detect purchases here.
        </p>
      </div>
    </div>
  );
}
