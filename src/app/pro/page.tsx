'use client';

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'Fee Pilot Pro',
  description:
    'Unlock power features for sellers. Pro adds reverse calculator and more.',
  alternates: { canonical: '/pro' },
};

const checkoutUrl = process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL;

/**
 * Redirect to checkout if NEXT_PUBLIC_PRO_CHECKOUT_URL is set.
 * Otherwise, show a friendly “coming soon” message.
 */
function handleGetPro() {
  if (checkoutUrl && typeof window !== 'undefined') {
    window.location.href = checkoutUrl;
    return;
  }
  alert('Checkout coming soon ✨');
}

export default function ProPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <header className="py-10">
        <h1 className="text-4xl font-semibold tracking-tight">FeePilot Pro</h1>
        <p className="mt-2 opacity-80">
          Unlock power features for sellers
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
            <button
              type="button"
              onClick={handleGetPro}
              className="rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
            >
              Get Pro
            </button>

            {/* Keep reverse calc discoverable but route to the Pro overview (not straight to the tool) */}
            <Link
              href={'/pro/target' as Route}
              className="rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
            >
              Reverse calculator (beta)
            </Link>
          </div>

          {!checkoutUrl && (
            <p className="mt-3 text-xs opacity-60">
              Tip: set <code>NEXT_PUBLIC_PRO_CHECKOUT_URL</code> in your Vercel
              Project Env to enable checkout.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
