import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Docs — Fee Pilot',
  description:
    'Documentation for Fee Pilot: how to use the calculator, export CSV, share results, and explore Pro tools like the Reverse Calculator.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Fee Pilot Docs',
    description:
      'Learn how to use Fee Pilot to estimate fees, compare outcomes, and share results. Includes notes on Pro features.',
    url: '/docs',
    siteName: 'Fee Pilot',
    type: 'article',
  },
  robots: { index: true, follow: true, googleBot: { indexifembedded: true, noimageindex: true } },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does Fee Pilot store my data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Calculations run in your browser. We do not store the numbers you enter.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I export results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Use “Download CSV” to export fee breakdowns for spreadsheets and audits.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I share results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click “Copy link” to generate a shareable URL with your current calculator inputs.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Fee Pilot Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pro adds the Reverse Calculator so you can work backward from a target payout.',
      },
    },
  ],
};

const feeGuides = [
  {
    slug: '/docs/etsy-fees' as Route,
    name: 'Etsy',
    line: 'Etsy Fees Guide — how Etsy fees are calculated',
  },
  {
    slug: '/docs/depop-fees' as Route,
    name: 'Depop',
    line: 'Depop Fees Guide — how Depop fees are calculated',
  },
  {
    slug: '/docs/mercari-fees' as Route,
    name: 'Mercari',
    line: 'Mercari Fees Guide — how Mercari fees are calculated',
  },
  {
    slug: '/docs/poshmark-fees' as Route,
    name: 'Poshmark',
    line: 'Poshmark Fees Guide — how Poshmark fees are calculated',
  },
  {
    slug: '/docs/ebay-fees' as Route,
    name: 'eBay',
    line: 'eBay Fees Guide — how eBay fees are calculated',
  },
  {
    slug: '/docs/stockx-fees' as Route,
    name: 'StockX',
    line: 'StockX Fees Guide — how StockX fees are calculated',
  },
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-docs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Page title */}
      <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
        Fee Pilot Docs
      </h1>

      <p className="mt-4 text-base text-white" suppressHydrationWarning>
        This guide covers the core calculator, CSV export, sharing, and Pro features. If you’re new,
        start with the calculator, then explore Pro for advanced workflows.
      </p>

      {/* Core features */}
      <section className="mt-8 space-y-4 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">Core features</h2>
        <ul className="list-disc pl-6">
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

      {/* Pro tools */}
      <section className="mt-8 space-y-4 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">Pro tools</h2>
        <ul className="list-disc pl-6">
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

      {/* Marketplace guides for SEO */}
      <section className="mt-8 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">
          Marketplace fee guides
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Deep dives on how each marketplace&apos;s fees are calculated, with real-world examples
          and notes on promos, shipping, and discounts.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {feeGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.slug}
              className="group block rounded-2xl border border-purple-600/40 bg-black/40 p-4 transition hover:border-purple-400/80 hover:bg-black/70"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{guide.name}</h3>
                <span className="text-[11px] font-medium uppercase tracking-wide text-purple-300 group-hover:text-purple-200">
                  Fee guide
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-300">{guide.line}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-8 space-y-4 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">FAQ</h2>
        <ul className="list-disc pl-6">
          <li>Does Fee Pilot store my data? No—calculations run in your browser.</li>
          <li>Can I override fees? Pro-ready overrides are planned.</li>
          <li>Where can I give feedback? Reach out via the About page.</li>
        </ul>
      </section>

      {/* Footer note (keep subtle) */}
      <section className="mt-8 text-sm text-gray-600">
        <p>Built with Next.js 15 and React 19. Deployed on Vercel. Privacy-friendly by design.</p>
      </section>
    </main>
  );
}

type Route =
  | '/'
  | '/about'
  | '/docs'
  | '/pro'
  | '/pro/target'
  | '/docs/etsy-fees'
  | '/docs/depop-fees'
  | '/docs/mercari-fees'
  | '/docs/poshmark-fees'
  | '/docs/ebay-fees'
  | '/docs/stockx-fees';
