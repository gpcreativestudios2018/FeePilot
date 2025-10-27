'use client';

import React from 'react';
import Link from 'next/link';
import { PILL_CLASS } from '@/lib/ui';

export default function ReverseCalcPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reverse calculator</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Set a target profit or margin — we’ll suggest the listing price.
        </p>
      </header>

      <section className="rounded-2xl border border-purple-600/40 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target profit ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 25"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Target margin (%)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">COGS ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Your shipping cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-purple-600/40 bg-transparent px-3 py-2 outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <button className={PILL_CLASS} aria-label="Calculate suggested price" disabled>
            Calculate (coming soon)
          </button>
          <Link href="/pro" className={PILL_CLASS}>
            Back to Pro
          </Link>
        </div>
      </section>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Tip: You’ll be able to choose platform and fee overrides here in Pro.
      </p>
    </main>
  );
}
