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
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        {/* Free card */}
        <div className="rounded-2xl border border-purple-600/40 bg-black/40 p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Free</div>
          <div className="mt-2 text-3xl font-bold">$0</div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-100">
            <li>Core fee calculations</li>
            <li>Light/Dark theme</li>
            <li>Share / copy permalink</li>
            <li>Comparison table</li>
            <li>CSV export</li>
          </ul>
          <Link
            href={'/' as Route}
            className="mt-6 inline-flex items-center rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
          >
            Continue free
          </Link>
        </div>

        {/* Pro card */}
        <div className="rounded-2xl border border-purple-600/40 bg-black/40 p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-300">Pro</div>
          <div className="mt-2 text-3xl font-bold">$5/mo</div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-100">
            <li>
              <strong>Custom fee rules</strong> per platform
            </li>
            <li>Saved presets (name &amp; quick-load)</li>
            <li>Reverse calculator (target payout)</li>
            <li>CSV export of comparisons</li>
            <li>Priority updates to fee rules</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {hasCheckout ? (
              <a
                href={checkoutUrl as string}
                className="inline-flex items-center rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
              >
                Get Pro
              </a>
            ) : (
              <button
                type="button"
                onClick={() => alert('Checkout coming soon ✨')}
                className="inline-flex items-center rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
              >
                Get Pro
              </button>
            )}
          </div>

          {!hasCheckout && (
            <p className="mt-3 text-xs text-gray-400">
              Tip: set <code className="font-mono text-[11px]">NEXT_PUBLIC_PRO_CHECKOUT_URL</code>{' '}
              in Vercel (Preview &amp; Production) and redeploy so this button goes to checkout.
            </p>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Already using the free calculator? You can upgrade anytime — your workflow stays the
            same, you just get more control.
          </p>
        </div>
      </section>
    </main>
  );
}
