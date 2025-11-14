import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Docs — Fee Pilot',
  description:
    'Documentation for Fee Pilot: how to use the calculator, export CSV, share results, and explore Pro tools like the Reverse Calculator.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'Fee Pilot Docs',
    description:
      'Learn how to use Fee Pilot to estimate fees, compare outcomes, and share results. Includes notes on Pro features.',
    url: '/docs',
    siteName: 'Fee Pilot',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      indexifembedded: true,
      noimageindex: true,
    },
  },
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Fee Pilot Docs</h1>

      <p className="mt-4 text-base text-gray-700" suppressHydrationWarning>
        This guide covers the core calculator, CSV export, sharing, and Pro features. If you’re new,
        start with the calculator, then explore Pro for advanced workflows.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-medium">Core features</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <strong>Calculator:</strong>{' '}
            <Link href={'/' as Route} className="underline">
              Enter amounts and see fee breakdowns
            </Link>
            .
          </li>
          <li>
            <strong>Share:</strong> Generate shareable links to revisit or send to teammates.
          </li>
          <li>
            <strong>CSV Export:</strong> Download results for spreadsheets and audits.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-medium">Pro tools</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <strong>Overview:</strong>{' '}
            <Link href={'/pro' as Route} className="underline">
              See what’s in Pro
            </Link>
            .
          </li>
          <li>
            <strong>Reverse Calculator (beta):</strong>{' '}
            <Link href={'/pro/target' as Route} className="underline">
              Work backward from a target payout
            </Link>
            .
          </li>
        </ul>
      </section>

      {/* New: Marketplace guides for SEO */}
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-medium">Marketplace fee guides</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <Link href={'/docs/etsy-fees' as Route} className="underline">
              Etsy Fees Guide — how Etsy fees are calculated
            </Link>
          </li>
          {/* Future: add Depop/Mercari pages here */}
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-medium">FAQ</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Does Fee Pilot store my data? No—calculations run in your browser.</li>
          <li>Can I override fees? Pro-ready overrides are planned.</li>
          <li>Where can I give feedback? Reach out via the About page.</li>
        </ul>
      </section>

      <section className="mt-8 text-sm text-gray-600">
        <p>
          Built with Next.js 15 and React 19. Deployed on Vercel. Privacy-friendly by design.
        </p>
      </section>
    </main>
  );
}

// Typed route helper
type Route =
  | '/'
  | '/about'
  | '/docs'
  | '/pro'
  | '/pro/target'
  | '/docs/etsy-fees';
