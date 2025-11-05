import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'About Fee Pilot',
  description:
    'What Fee Pilot does and how fees are calculated. Free calculator with CSV export and shareable links. Pro adds the reverse calculator.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">About Fee Pilot</h1>

      <p>
        Fee Pilot is a fast, accurate <strong>marketplace fee calculator</strong> for
        popular platforms including Etsy, StockX, eBay, Depop, Mercari, and Poshmark.
        It provides clear fee breakdowns and estimated earnings using each marketplace’s
        current rules.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What’s included (Free)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Main calculator with fee breakdown and summary cards</li>
          <li>CSV export</li>
          <li>Shareable links (copy URL with current inputs)</li>
          <li>Local presets</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pro features</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li className="flex items-center gap-2">
            <span>Reverse calculator to hit a target payout</span>
            <span className="rounded-full border px-2 py-0.5 text-xs opacity-70">Pro</span>
          </li>
        </ul>
        {/* Link to the Pro overview, not directly to the Pro-only tool */}
        <p className="text-sm opacity-80">
          Learn more on the{' '}
          <Link
            href={'/pro' as Route}
            className="underline underline-offset-4 hover:opacity-100"
          >
            Pro page
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Notes on accuracy</h2>
        <p>
          Fee calculations follow platform-specific rules. For example, Poshmark fees
          are based on the discounted item price only: a flat <strong>$2.95</strong> if the
          discounted price is <strong>under $15</strong>, otherwise <strong>20%</strong>. Buyer-paid
          shipping is not part of the fee base.
        </p>
      </section>

      <p className="opacity-70 text-sm">
        Built with Next.js 15 / React 19. Aims to be fast, accessible, and privacy-friendly.
      </p>
    </main>
  );
}
