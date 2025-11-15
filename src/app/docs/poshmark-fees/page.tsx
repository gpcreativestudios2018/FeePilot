import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Poshmark Fees Guide — How Poshmark fees are calculated (2025)',
  description:
    'Quick breakdown of Poshmark fees: flat fee for low totals and a percent for higher totals. See typical effective rates and a simple estimate.',
  alternates: { canonical: '/docs/poshmark-fees' },
  openGraph: {
    type: 'article',
    title: 'Poshmark Fees Guide — How Poshmark fees are calculated',
    description: 'Understand Poshmark’s fee structure with examples and tips.',
    url: '/docs/poshmark-fees',
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
      name: 'What fees does Poshmark charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a flat fee for sales under a small threshold and a percent fee for sales above that threshold. Exact amounts can vary by country and current policy.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I pay fees on shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Shipping is often handled via prepaid labels on Poshmark. Review Poshmark’s latest policies for your region to see how shipping interacts with fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I quickly estimate Poshmark fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator. Enter price, shipping, and cost to estimate net payout; export CSV or share a link to compare outcomes.',
      },
    },
  ],
};

export default function PoshmarkFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-poshmark-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Page title (match Docs/About style) */}
      <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
        Poshmark Fees Guide (Quick Overview)
      </h1>

      <p className="mt-4 text-base text-white" suppressHydrationWarning>
        Poshmark typically charges a <strong>flat fee</strong> on lower-order totals and a{' '}
        <strong>percent-based fee</strong> on higher totals. Check Poshmark’s official docs for the
        latest numbers in your region.
      </p>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">What&apos;s included</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Flat fee:</strong> applied to smaller order totals (varies by country/plan).
          </li>
          <li>
            <strong>Percent fee:</strong> applied to orders above the flat-fee threshold.
          </li>
          <li>
            <strong>Shipping:</strong> often prepaid labels; fee interplay differs by region.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">
          Back-of-the-napkin estimate
        </h2>
        <p>
          A quick sanity check: the <em>percent fee</em> usually dominates for higher-price items,
          while the <em>flat fee</em> matters more for lower-price items. Use the calculator to see
          the impact on your specific price + shipping.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">
          Run a quick calculation
        </h2>
        <p>
          Try the main calculator to estimate net payout, compare outcomes, export CSV, or share a
          link.
        </p>
        <p className="mt-2">
          <Link href={'/' as Route} className="underline">
            Open Fee Pilot calculator
          </Link>
        </p>
      </section>

      <section className="mt-10 text-sm text-gray-600">
        <p>
          Disclaimer: Fee Pilot is not affiliated with Poshmark. This page is a general guide;
          consult Poshmark’s official documentation for the latest rates and rules.
        </p>
      </section>
    </main>
  );
}

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/poshmark-fees';
