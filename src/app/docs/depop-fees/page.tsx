import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Depop Fees Guide — How Depop fees are calculated (2025)',
  description:
    'Quick breakdown of Depop fees: selling fee and payment processing. See typical effective rates and examples.',
  alternates: { canonical: '/docs/depop-fees' },
  openGraph: {
    type: 'article',
    title: 'Depop Fees Guide — How Depop fees are calculated',
    description:
      'Understand Depop’s selling fee and payment processing with examples and tips.',
    url: '/docs/depop-fees',
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
      name: 'What fees does Depop charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a selling fee (often ~10% of item price + shipping) and a payment processing fee (fixed + percent, varies by country/payment provider).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the effective total rate on Depop?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Many sellers land around ~12%–14% total before any fixed payment fee, depending on region and provider. Your exact rate may vary.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Depop apply fees to shipping charges?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'In many cases, Depop’s selling fee applies to the item price plus the shipping the buyer pays. Check Depop’s latest policies for your region.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I estimate Depop fees quickly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator: enter price, shipping, and cost to see net payout. Export CSV or share a link to compare outcomes.',
      },
    },
  ],
};

export default function DepopFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-depop-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Page title (match Docs/About style) */}
      <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
        Depop Fees Guide (Quick Overview)
      </h1>

      <p className="mt-4 text-base text-white" suppressHydrationWarning>
        Depop fees generally include a <strong>selling fee</strong> (often around 10% of the
        buyer’s total) and a <strong>payment processing fee</strong> (fixed + percent, varies by
        country and provider). Rates and rules can change—always confirm in Depop’s official help
        docs.
      </p>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">What&apos;s included</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Selling fee:</strong> commonly ~10% of item price + shipping paid by the buyer.
          </li>
          <li>
            <strong>Payment processing:</strong> fixed + percent; varies by country/provider.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">
          Back-of-the-napkin estimate
        </h2>
        <p>
          A quick sanity check: <em>~12%–14% of price + shipping</em> for marketplace + processing,
          then add any fixed payment component. Your exact numbers depend on your region/provider.
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
          Disclaimer: Fee Pilot is not affiliated with Depop. This page is a general guide; consult
          Depop’s official documentation for the latest rates and rules.
        </p>
      </section>
    </main>
  );
}

// Typed route helper for links
type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/depop-fees';
