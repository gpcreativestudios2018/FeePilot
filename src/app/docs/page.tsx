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
    { '@type': 'Question', name: 'Does Fee Pilot store my data?', acceptedAnswer: { '@type': 'Answer', text: 'No. Calculations run in your browser. We do not store the numbers you enter.' } },
    { '@type': 'Question', name: 'Can I export results?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use “Download CSV” to export fee breakdowns for spreadsheets and audits.' } },
    { '@type': 'Question', name: 'How do I share results?', acceptedAnswer: { '@type': 'Answer', text: 'Click “Copy link” to generate a shareable URL with your current calculator inputs.' } },
    { '@type': 'Question', name: 'What is Fee Pilot Pro?', acceptedAnswer: { '@type': 'Answer', text: 'Pro adds the Reverse Calculator so you can work backward from a target payout.' } },
  ],
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* FAQ JSON-LD for rich results */}
      <Script id="faq-docs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

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
          <li><strong>Share:</strong> Generate shareable links to revisit or send to teammates.</li>
          <li><strong>CSV Export:</strong> Download results for spreadsheets and audits.</li>
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

      {/* Marketplace guides for SEO */}
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-medium">Marketplace fee guides</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li><Link href={'/docs/etsy-fees' as Route} className="underline">Etsy Fees Guide — how Etsy fees are calculated</Link></li>
          <li><Link href={'/docs/depop-fees' as Route} className="underline">Depop Fees Guide — how Depop fees are calculated</Link></li>
          <li><Link href={'/docs/mercari-fees' as Route} className="underline">Mercari Fees Guide — how Mercari fees are calculated</Link></li>
          <li><Link href={'/docs/poshmark-fees' as Route} className="underline">Poshmark Fees Guide — how Poshmark fees are calculated</Link></li>
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
  | '/docs/poshmark-fees';
