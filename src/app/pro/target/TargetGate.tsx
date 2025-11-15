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

  const allow = !REQUIRE_PRO || unlockedViaQuery;
  if (allow) return <>{children}</>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-2xl border border-purple-500/40 bg-black/20 p-8">
        {/* Title + intro (more in line with Docs/About) */}
        <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
          Reverse Calculator (Pro)
        </h1>

        <p className="mt-4 text-lg text-gray-300">
          Work backward from a <strong>target payout</strong> instead of guessing sale prices. The
          Reverse Calculator is part of <strong>Fee Pilot Pro</strong>.
        </p>

        <p className="mt-3 text-sm text-gray-400">
          Upgrade when you&apos;re ready for deeper control—your existing free calculator workflow
          stays exactly the same.
        </p>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-300">
          <li>Start from a target take-home amount.</li>
          <li>See what sale price you need after fees and costs.</li>
          <li>Compare platforms using the same target payout.</li>
        </ul>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          {CHECKOUT_URL ? (
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-purple-400/60 bg-white px-6 py-2.5 text-sm font-medium text-black shadow-sm hover:opacity-90"
              onClick={() => trackEvent('Get Pro Click')}
            >
              Get Pro
            </a>
          ) : null}

          <button
            type="button"
            className="inline-flex items-center rounded-full border border-purple-400/40 px-6 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/5"
            onClick={() => {
              trackEvent('Support Click');
              setShowHelp(true);
            }}
          >
            I already purchased
          </button>

          <Link
            href={'/pro' as Route}
            className="inline-flex items-center rounded-full border border-purple-400/40 px-6 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/5"
          >
            Back to Pro overview
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Note: This is a temporary, client-side gate for demos. Later, replace it with real auth
          and webhooks for production Pro access.
        </p>

        {showHelp ? (
          <div className="mt-4 text-sm text-gray-400" suppressHydrationWarning>
            <p className="mb-2">
              If you already purchased, open your <strong>Pro access link</strong> (it includes{' '}
              <code>?pro=1</code>). That link unlocks the Reverse Calculator on this device.
            </p>
            <p>
              Didn&apos;t receive your link or need help? Visit the{' '}
              <Link href={'/pro' as Route} className="underline">
                Pro page
              </Link>{' '}
              for support options.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
