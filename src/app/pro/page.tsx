'use client';

import React from 'react';
import Link from 'next/link';

export default function ProPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">FeePilot Pro</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Unlock power features for sellers who want finer control and faster workflows.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-purple-600/40 p-6">
          <div className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Free</div>
          <div className="mt-2 text-3xl font-semibold">$0</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Core fee calculations</li>
            <li>• Light/Dark theme</li>
            <li>• Share/Copy permalink</li>
            <li>• Comparison table</li>
          </ul>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-purple-600/50 px-4 py-2 text-sm hover:bg-white/5"
            >
              Continue free
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border border-purple-600/60 p-6">
          <div className="text-sm uppercase tracking-wide text-purple-600">Pro</div>
          <div className="mt-2 text-3xl font-semibold">$5/mo</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• <b>Custom fee rules</b> per platform</li>
            <li>• <b>Saved presets</b> (name & quick-load)</li>
            <li>• <b>CSV export</b> of comparisons</li>
            <li>• Priority updates to fee rules</li>
          </ul>
          <div className="mt-6">
            {/* Placeholder CTA for now; we’ll wire real checkout later */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Checkout coming soon ✨');
              }}
              className="inline-flex items-center rounded-full border border-purple-600/60 px-4 py-2 text-sm hover:bg-white/5"
            >
              Get Pro
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Looking for early access? Email <a href="mailto:hello@example.com" className="underline">hello@example.com</a>
          </p>
        </div>
      </section>
    </main>
  );
}
