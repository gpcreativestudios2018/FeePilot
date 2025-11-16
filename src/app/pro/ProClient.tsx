'use client';

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';

// Inlined at build time
const checkoutUrl = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL;
const hasCheckout = Boolean(checkoutUrl);

export default function ProClient() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pb-20">
      {/* Hero / overview (match Docs/About vibe) */}
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
          Fee Pilot Pro
        </h1>
        <p className="mt-4 text-base text-white" suppressHydrationWarning>
          Unlock power features for sellers: work backward from a target payout, tune fee rules,
          and export comparisons for your workflow.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Start with the free calculator, then upgrade when you&apos;re ready for deeper control.
        </p>
      </header>

      {/* Free vs Pro overview */}
      <section className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-purple-300/80">
          Compare plans
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free card */}
          <div className="flex flex-col rounded-2xl border border-purple-600/30 bg-black/40 p-6 text-white">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Free
                </div>
                <div className="mt-2 text-3xl font-bold">$0</div>
              </div>
              <span className="rounded-full border border-gray-600/70 px-3 py-1 text-[11px] font-medium text-gray-300">
                Best for getting started
              </span>
            </div>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-100">
              <li>Core fee calculations</li>
              <li>Light/Dark theme</li>
              <li>Share / copy permalink</li>
              <li>Comparison table</li>
              <li>CSV export</li>
            </ul>

            <div className="mt-6 flex flex-1 items-end">
              <Link
                href={'/' as Route}
                className="inline-flex items-center justify-center rounded-full border border-purple-600/60 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Continue free
              </Link>
            </div>
          </div>

          {/* Pro card */}
          <div className="relative flex flex-col rounded-2xl border-2 border-purple-400/80 bg-gradient-to-b from-purple-900/60 via-black/80 to-black p-6 text-white shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <span className="pointer-events-none absolute -top-3 right-4 rounded-full bg-purple-500/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg">
              Recommended
            </span>

            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Pro
                </div>
                <div className="mt-2 text-3xl font-bold">$5/mo</div>
                <p className="mt-1 text-xs text-purple-100/80">
                  Early supporter pricing — keep this rate as Pro grows.
                </p>
              </div>
              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-[11px] font-medium text-purple-100">
                Power users &amp; high-volume sellers
              </span>
            </div>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-100">
              <li>
                <strong>Custom fee rules</strong> per platform
              </li>
              <li>Saved presets (name &amp; quick-load)</li>
              <li>Reverse calculator (target payout)</li>
              <li>CSV export of comparisons</li>
              <li>Priority updates to fee rules</li>
            </ul>

            <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
              <div className="flex flex-wrap gap-3">
                {hasCheckout ? (
                  <a
                    href={checkoutUrl as string}
                    className="inline-flex items-center justify-center rounded-full border border-purple-300/80 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-50 transition hover:bg-purple-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Get Pro
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('Checkout coming soon ✨')}
                    className="inline-flex items-center justify-center rounded-full border border-purple-300/80 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-50 transition hover:bg-purple-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Get Pro
                  </button>
                )}
              </div>

              {!hasCheckout && (
                <p className="text-xs text-gray-400">
                  Tip: set{' '}
                  <code className="font-mono text-[11px]">
                    NEXT_PUBLIC_PRO_CHECKOUT_URL
                  </code>{' '}
                  in Vercel (Preview &amp; Production) and redeploy so this button goes to
                  checkout.
                </p>
              )}

              <p className="text-xs text-gray-400">
                Already using the free calculator? You can upgrade anytime — your workflow
                stays the same, you just get more control.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
