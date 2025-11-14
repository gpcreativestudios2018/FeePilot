'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { track as trackEvent } from '@/lib/analytics';

const REQUIRE_PRO = (process.env.NEXT_PUBLIC_REQUIRE_PRO || '') === '1';
const CHECKOUT_URL = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || '';

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target';

export default function TargetGate({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const unlockedViaQuery = useMemo(() => params?.get('pro') === '1', [params]);
  const [showHelp, setShowHelp] = useState(false);

  // Gate stays up unless ?pro=1, or the env gate is off.
  const allow = !REQUIRE_PRO || unlockedViaQuery;
  if (allow) return <>{children}</>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-2xl border border-purple-500/40 bg-black/20 p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Reverse Calculator (Pro)</h1>

        <p className="mt-4 text-lg text-gray-300">
          This tool is part of <strong>Fee Pilot Pro</strong>. Get access to work backward from a
          target payout.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          {CHECKOUT_URL ? (
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-purple-400/40 bg-white px-6 py-3 text-sm font-medium text-black shadow-sm hover:opacity-90"
              onClick={() => trackEvent('Get Pro Click')}
            >
              Get Pro
            </a>
          ) : null}

          {/* Do NOT navigate; keep the gate closed */}
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-purple-400/40 px-6 py-3 text-sm font-medium text-gray-200 hover:bg-white/5"
            onClick={() => {
              trackEvent('Support Click');
              setShowHelp(true);
            }}
          >
            I already purchased
          </button>

          <Link
            href={'/pro' as Route}
            className="inline-flex items-center rounded-xl border border-purple-400/40 px-6 py-3 text-sm font-medium text-gray-200 hover:bg-white/5"
          >
            Back to Pro overview
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Note: This is a temporary, client-side gate for demos. Replace with real auth + webhooks
          later.
        </p>

        {showHelp ? (
          <div className="mt-4 text-sm text-gray-400" suppressHydrationWarning>
            <p className="mb-2">
              If you already purchased, open your <strong>Pro access link</strong> (it includes{' '}
              <code>?pro=1</code>).
            </p>
            <p>
              Didn’t get it? Visit the{' '}
              <Link href={'/pro' as Route} className="underline">
                Pro page
              </Link>{' '}
              for support.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
