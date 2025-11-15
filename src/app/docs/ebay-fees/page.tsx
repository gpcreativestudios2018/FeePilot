import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'eBay Fees Guide — How eBay fees are calculated (2025)',
  description:
    'Quick breakdown of eBay fees: final value fee and payment processing. See typical effective rates and a simple estimate.',
  alternates: { canonical: '/docs/ebay-fees' },
  openGraph: {
    type: 'article',
    title: 'eBay Fees Guide — How eBay fees are calculated',
    description:
      'Understand eBay’s final value fee and payment processing with examples and tips.',
    url: '/docs/ebay-fees',
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
      name: 'What fees does eBay charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Typically: a final value fee (category-dependent %) and payment processing. Extra fees can apply for optional upgrades or international sales.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do fees apply to shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'eBay’s final value fee often applies to the total amount of the sale, including shipping charged to the buyer. Check current eBay policy for your category/region.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I estimate eBay fees quickly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Use the Fee Pilot calculator. Enter price, shipping, and cost to estimate net payout; export CSV or share a link to compare outcomes.',
      },
    },
  ],
};

export default function EbayFeesDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script
        id="faq-ebay-fees"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1 className="text-3xl font-semibold tracking-tight">eBay Fees Guide (Quick Overview)</h1>

      <p className="mt-4 text-base text-gray-300" suppressHydrationWarning>
        eBay fees typically include a <strong>final value fee</strong> (category-dependent %) and{' '}
        <strong>payment processing</strong>. Policies can change—check eBay’s official help for the
        latest rates and category specifics.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">What’s included</h2>
        <ul className="list-disc pl-6 text-gray-300">
          <li><strong>Final value fee:</strong> percentage varies by category/region.</li>
          <li><strong>Payment processing:</strong> fixed + percent; varies by country/provider.</li>
          <li><strong>Optional add-ons:</strong> listing upgrades, international, promos, etc.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">Back-of-the-napkin estimate</h2>
        <p className="text-gray-300">
          A quick sanity check many sellers use: <em>~12%–15% of price + shipping</em> for marketplace + processing,
          then add any optional upgrade costs. Exact rates vary by category/region.
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
          Disclaimer: Fee Pilot is not affiliated with eBay. This page is a general guide; consult
          eBay’s official documentation for the latest rates and rules.
        </p>
      </section>
    </main>
  );
}

type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target' | '/docs/ebay-fees';
