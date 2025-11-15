import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mercari Fees Guide — How Mercari fees are calculated (2025)',
  description:
    'Quick breakdown of Mercari fees: selling fee and payment processing. See typical effective rates and a simple estimate.',
  alternates: { canonical: '/docs/mercari-fees' },
  openGraph: {
    type: 'article',
    title: 'Mercari Fees Guide — How Mercari fees are calculated',
    description:
      'Understand Mercari’s selling fee and payment processing with examples and tips.',
    url: '/docs/mercari-fees',
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
      name: 'What fees does Mercari charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a selling fee (often ~10%) and a payment processing fee (fixed + percent, varies by region/provider).',
      },
    },
    {
      '@type': 'Question',
      name: 'Do fees apply to shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Depending on how shipping is handled (seller vs. prepaid labels), the fee treatment can differ. Check Mercari’s latest policies for your region.',
      },
    },
    {
      '@type': 'Question',
      name: 'What’s a quick way to estimate Mercari fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator. Enter price, shipping, and cost to estimate net payout; export CSV or share a link to compare outcomes.',
      },
    },
  ],
};

export default function MercariFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-mercari-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Page title (match Docs/About style) */}
      <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
        Mercari Fees Guide (Quick Overview)
      </h1>

      <p className="mt-4 text-base text-white" suppressHydrationWarning>
        Mercari fees generally include a <strong>selling fee</strong> (often around 10% of the
        buyer’s total) and a <strong>payment processing fee</strong> (fixed + percent, varies by
        region/provider). Policies can change—always confirm in Mercari’s official help docs.
      </p>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">What&apos;s included</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Selling fee:</strong> commonly ~10% of the buyer’s total.
          </li>
          <li>
            <strong>Payment processing:</strong> fixed + percent; varies by region/provider.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">
          Back-of-the-napkin estimate
        </h2>
        <p>
          A quick sanity check: <em>~12%–14% of price + shipping</em> for marketplace + processing,
          then add any fixed processing component. Your exact figures depend on your
          region/provider.
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
          Disclaimer: Fee Pilot is not affiliated with Mercari. This page is a general guide; consult
          Mercari’s official documentation for the latest rates and rules.
        </p>
      </section>
    </main>
  );
}

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/mercari-fees';
