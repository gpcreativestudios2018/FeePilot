'use client';

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';

// Inlined at build time
const checkoutUrl = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL;
const hasCheckout = Boolean(checkoutUrl);

export default function ProClient() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <header className="py-10">
        <h1 className="text-4xl font-semibold tracking-tight">FeePilot Pro</h1>
        <p className="mt-2 opacity-80">Unlock power features for sellers</p>
        <p className="mt-2 text-xs opacity-60">
          Checkout URL detected: <strong>{hasCheckout ? 'yes' : 'no'}</strong>
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {/* Free card */}
        <div className="rounded-2xl border border-purple-600/40 p-6">
          <div className="text-sm opacity-70">FREE</div>
          <div className="mt-2 text-4xl font-bold">$0</div>
          <ul className="mt-4 list-disc space-y-2 pl-5 opacity-90">
            <li>Core fee calculations</li>
            <li>Light/Dark theme</li>
            <li>Share/Copy permalink</li>
            <li>Comparison table</li>
            <li>CSV export</li>
          </ul>
          <Link
            href={'/' as Route}
            className="mt-6 inline-block rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
          >
            Continue free
          </Link>
        </div>

        {/* Pro card */}
        <div className="rounded-2xl border border-purple-600/40 p-6">
          <div className="text-sm opacity-70">PRO</div>
          <div className="mt-2 text-4xl font-bold">$5/mo</div>
          <ul className="mt-4 list-disc space-y-2 pl-5 opacity-90">
            <li><strong>Custom fee rules</strong> per platform</li>
            <li>Saved presets (name &amp; quick-load)</li>
            <li>CSV export of comparisons</li>
            <li>Priority updates to fee rules</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {hasCheckout ? (
              // Real link when checkout URL is available
              <a
                href={checkoutUrl as string}
                className="rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
              >
                Get Pro
              </a>
            ) : (
              // Fallback button when not configured
              <button
                type="button"
                onClick={() => alert('Checkout coming soon ✨')}
                className="rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
              >
                Get Pro
              </button>
            )}

            {/* Pro page can link directly to the Pro tool */}
            <Link
              href={'/pro/target' as Route}
              className="rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
            >
              Reverse calculator (beta)
            </Link>
          </div>

          {!hasCheckout && (
            <p className="mt-3 text-xs opacity-60">
              Tip: set <code>NEXT_PUBLIC_PRO_CHECKOUT_URL</code> in Vercel (Preview &amp; Production)
              and redeploy so this page detects it.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
