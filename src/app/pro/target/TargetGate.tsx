'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { track as trackEvent } from '@/lib/analytics';

const REQUIRE_PRO = (process.env.NEXT_PUBLIC_REQUIRE_PRO || '') === '1';
const CHECKOUT_URL = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || '';

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target';

export default function TargetGate({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const unlockedViaQuery = useMemo(() => params?.get('pro') === '1', [params]);
  const [showHelp, setShowHelp] = useState(false);

  const allow = !REQUIRE_PRO || unlockedViaQuery;
  if (allow) return <>{children}</>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Reverse Calculator (Pro)</h1>
      <p className="mt-4 text-base text-gray-300">
        This feature is part of <strong>Fee Pilot Pro</strong>. Unlock it to work backward from a
        target take-home and instantly compute the required listing price.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {CHECKOUT_URL ? (
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm bg-white text-black hover:opacity-90"
            onClick={() => trackEvent('Get Pro Click')}
          >
            Get Pro
          </a>
        ) : null}

        <button
          type="button"
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-gray-500/60 hover:bg-white/5"
          onClick={() => { trackEvent('Support Click'); setShowHelp(true); }}
        >
          I already purchased
        </button>
      </div>

      {showHelp ? (
        <div className="mt-6 text-sm text-gray-400" suppressHydrationWarning>
          <p className="mb-2">
            If you already purchased, open your <strong>Pro access link</strong> (it includes <code>?pro=1</code>).
          </p>
          <p>
            Didn’t get it? Visit the <a href={'/pro' as Route} className="underline">Pro page</a> for support.
          </p>
        </div>
      ) : null}
    </main>
  );
}
