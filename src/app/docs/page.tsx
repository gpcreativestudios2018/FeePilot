import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How to use Fee Pilot: calculator tips, sharing links, CSV export, and Pro features overview.',
  alternates: { canonical: '/docs' },
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p>
          Fee Pilot helps you estimate marketplace fees and your earnings with a clear breakdown.
          You can copy a shareable link (with your current inputs) and export a CSV of the fee breakdown.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Features</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Calculator with summary cards and detailed breakdown</li>
          <li>Copy a shareable link that captures your current inputs</li>
          <li>CSV export</li>
          <li>
            <strong>Pro:</strong> Reverse calculator (see the{' '}
            <Link href="/pro" className="underline underline-offset-4">
              Pro page
            </Link>
            )
          </li>
        </ul>
      </section>

      <p className="opacity-70 text-sm">
        Built with Next.js 15 / React 19. Aims to be fast, accessible, and privacy-friendly.
      </p>
    </main>
  );
}
