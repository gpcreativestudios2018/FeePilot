// src/app/pro/target/TargetGate.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const REQUIRE = process.env.NEXT_PUBLIC_REQUIRE_PRO === '1';
const CHECKOUT_URL = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || '/pro';

// Simple, non-secure local flag for demos. Replace with real auth later.
const PRO_KEY = 'feepilot:pro';

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target';

export default function TargetGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasPro, setHasPro] = useState(false);

  useEffect(() => {
    if (!REQUIRE) {
      setHasPro(true);
      setReady(true);
      return;
    }

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('pro') === '1') {
        window.localStorage.setItem(PRO_KEY, '1');
        setHasPro(true);
        setReady(true);
        url.searchParams.delete('pro');
        window.history.replaceState({}, '', url.toString());
        return;
      }

      const stored = window.localStorage.getItem(PRO_KEY) === '1';
      setHasPro(stored);
    } catch {
      setHasPro(false);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm opacity-70" suppressHydrationWarning>
        Loading…
      </div>
    );
  }

  if (hasPro) return <>{children}</>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-white/10 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reverse Calculator (Pro)</h1>
        <p className="mt-3 opacity-80">
          This tool is part of Fee Pilot Pro. Get access to work backward from a target payout.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={CHECKOUT_URL}
            className="rounded-full border border-purple-600/50 px-4 py-2 hover:bg-white/5"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Pro
          </a>

          <button
            type="button"
            className="rounded-full border border-purple-600/50 px-4 py-2 hover:bg-white/5"
            onClick={() => {
              try {
                window.localStorage.setItem(PRO_KEY, '1');
              } catch {}
              window.location.reload();
            }}
          >
            I already purchased
          </button>

          <Link
            href={'/pro' as Route}
            className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/5"
          >
            Back to Pro overview
          </Link>
        </div>

        <p className="mt-4 text-xs opacity-60">
          Note: This is a temporary, client-side gate for demos. Replace with real auth + webhooks later.
        </p>
      </div>
    </main>
  );
}
