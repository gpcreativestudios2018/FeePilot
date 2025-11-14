import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Etsy Fees Guide — How Etsy fees are calculated (2025)',
  description:
    'A straightforward breakdown of Etsy fees: listing, transaction, and payment processing. Learn the effective total rate and see examples.',
  alternates: { canonical: '/docs/etsy-fees' },
  openGraph: {
    type: 'article',
    title: 'Etsy Fees Guide — How Etsy fees are calculated',
    description:
      'Understand Etsy’s listing, transaction, and payment processing fees with examples and tips.',
    url: '/docs/etsy-fees',
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
      name: 'What fees does Etsy charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a .20 listing fee per item (for 4 months), a transaction fee (around 6.5% of item price + shipping), and a payment processing fee (varies by country; commonly a fixed + % amount).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the effective total rate on Etsy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'For many sellers, the effective rate lands in the ~9%–12% range before listing fees, depending on location and payment processing. Listing fees add .20 per item.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I estimate Etsy fees quickly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator to enter price, shipping, and cost. Export CSV or share a link to compare outcomes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do shipping charges incur Etsy transaction fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes—Etsy’s transaction fee generally applies to the item price and the shipping price you charge the buyer.',
      },
    },
  ],
};

export default function EtsyFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Script
        id="faq-etsy-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-3xl font-semibold tracking-tight">Etsy Fees Guide (Quick Overview)</h1>

      <p className="mt-4 text-base text-gray-300" suppressHydrationWarning>
        Etsy fees typically include a <strong>.20 listing fee</strong> per item (for 4 months),
        a <strong>transaction fee</strong> (commonly ~6.5% of item price + shipping), and a{' '}
        <strong>payment processing fee</strong> (varies by country; often a fixed + percent). Actual
        rates and rules may change—always confirm in Etsy’s official help docs.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">What’s included</h2>
        <ul className="list-disc pl-6 text-gray-300">
          <li><strong>Listing fee:</strong> .20 per listing (renews every 4 months or when quantity sells).</li>
          <li><strong>Transaction fee:</strong> charged on the item price + shipping you charge the buyer (commonly around 6.5%).</li>
          <li><strong>Payment processing:</strong> fixed + percent, varies by country.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">Back-of-the-napkin estimate</h2>
        <p className="text-gray-300">
          A simple sanity check many sellers use: <em>~9%–12% of price + shipping</em> for marketplace
          + processing, then add <em>.20</em> per item for listing fees. Your exact numbers may
          differ by region and payment plan.
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
          Disclaimer: Fee Pilot is not affiliated with Etsy. This page is a general guide based on
          commonly cited fee structures; consult Etsy’s official documentation for the latest rates.
        </p>
      </section>
    </main>
  );
}

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/etsy-fees';