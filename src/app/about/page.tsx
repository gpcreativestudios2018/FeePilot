// src/app/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Fee Pilot',
  description:
    'Learn what Fee Pilot does, why it exists, and how to use it to estimate platform and payment processor fees. Includes links to Pro features and documentation.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Fee Pilot',
    description:
      'What Fee Pilot is, how it works, and where to learn more. Built with Next.js 15 / React 19.',
    url: '/about',
    siteName: 'Fee Pilot',
    type: 'website',
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

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Page title (match Docs style) */}
      <h1 className="text-3xl font-semibold tracking-tight text-purple-400 underline">
        About Fee Pilot
      </h1>

      <p className="mt-4 text-base text-white" suppressHydrationWarning>
        Fee Pilot helps you quickly estimate platform and processor fees, compare options, and share
        results. It’s fast, privacy-friendly, and built for clarity.
      </p>

      {/* What's included (match Docs section styling) */}
      <section className="mt-8 space-y-4 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">What&apos;s included</h2>
        <ul className="list-disc pl-6">
          <li>Main calculator with summary cards</li>
          <li>CSV export and shareable links</li>
          <li>
            Pro tools like the{' '}
            <Link href={'/pro/target' as Route} className="underline">
              Reverse Calculator (beta)
            </Link>
          </li>
          <li>SEO-friendly sitemap and dynamic OG image</li>
          <li>Docs and examples to get you started</li>
        </ul>
      </section>

      {/* Learn more (match Docs section styling) */}
      <section className="mt-8 space-y-4 text-white">
        <h2 className="text-xl font-medium text-purple-400 underline">Learn more</h2>
        <ul className="list-disc pl-6">
          <li>
            Read the{' '}
            <Link href={'/docs' as Route} className="underline">
              Docs
            </Link>
          </li>
          <li>
            Explore{' '}
            <Link href={'/pro' as Route} className="underline">
              Pro
            </Link>
          </li>
          <li>
            Try the{' '}
            <Link href={'/' as Route} className="underline">
              Calculator
            </Link>
          </li>
        </ul>
      </section>

      {/* Footer note (keep subtle like Docs) */}
      <section className="mt-8 text-sm text-gray-600">
        <p>
          Built with Next.js 15, React 19, and TypeScript. Deployed on Vercel. If you have
          feedback, we&apos;d love to hear it.
        </p>
      </section>
    </main>
  );
}

// Typed route helper
type Route = '/' | '/about' | '/docs' | '/pro' | '/pro/target';
