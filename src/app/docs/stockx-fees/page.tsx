import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'StockX Fees Guide — How StockX fees are calculated (2025)',
  description:
    'Quick breakdown of StockX fees: transaction fees, payment processing, and seller level effects. See typical effective rates and a simple estimate.',
  alternates: { canonical: '/docs/stockx-fees' },
  openGraph: {
    type: 'article',
    title: 'StockX Fees Guide — How StockX fees are calculated',
    description:
      'Understand StockX transaction and processing fees with examples and tips.',
    url: '/docs/stockx-fees',
    siteName: 'Fee Pilot',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, noimageindex: true },
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What fees does StockX charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a transaction fee (percentage that can vary by seller level/category) plus payment processing. There may be additional shipping/verification considerations depending on region and program.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do fees change based on seller level?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes—StockX fee tiers often depend on seller performance/volume and sometimes category. Higher tiers can have lower transaction fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I quickly estimate StockX fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator: enter price, shipping, and cost to estimate net payout. Export CSV or share a link to compare outcomes.',
      },
    },
  ],
};

export default function StockXFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-stockx-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-3xl font-semibold tracking-tight">StockX Fees Guide (Quick Overview)</h1>

      <p className="mt-4 text-base text-gray-300" suppressHydrationWarning>
        StockX fees usually include a <strong>transaction fee</strong> (percent, varies by seller
        level and sometimes category) plus <strong>payment processing</strong> (fixed + percent, may
        vary by region/provider). Policies change—always confirm via StockX&apos;s official docs.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">What’s included</h2>
        <ul className="list-disc pl-6 text-gray-300">
          <li><strong>Transaction fee:</strong> percentage that can vary by seller level/category.</li>
          <li><strong>Payment processing:</strong> fixed + percent; varies by region/provider.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">Back-of-the-napkin estimate</h2>
        <p className="text-gray-300">
          Many sellers see an effective total in the <em>~12%–15%</em> range for marketplace + processing,
          depending on tier/category. Your exact rate may differ by level and region.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">Run a quick calculation</h2>
        <p className="text-gray-300">
          Try the main calculator to estimate net payout, compare outcomes, export CSV, or share a link.
        </p>
        <p className="mt-2">
          <Link href={'/' as Route} className="underline">Open Fee Pilot calculator</Link>
        </p>
      </section>

      <section className="mt-10 text-sm text-gray-500">
        <p>
          Disclaimer: Fee Pilot is not affiliated with StockX. This page is a general guide; consult
          StockX’s official documentation for the latest rates and rules.
        </p>
      </section>
    </main>
  );
}

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/stockx-fees';
