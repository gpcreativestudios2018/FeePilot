import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Fee Pilot',
  description:
    'Learn what Fee Pilot does and how we calculate accurate Poshmark fees, including the $2.95 under-$15 flat fee and 20% otherwise.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">About Fee Pilot</h1>
      <p>
        Fee Pilot is a fast, accurate calculator for marketplace fees — with
        a focus on Poshmark. It includes the $2.95 flat fee for items under
        $15 and 20% otherwise, plus a reverse calculator to hit a target payout.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What’s included</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Main calculator with fee breakdown and summary cards</li>
          <li>Reverse calculator to reach a target payout (/pro/target)</li>
          <li>CSV export, shareable links, and local presets</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Accuracy</h2>
        <p>
          Poshmark fees are calculated on the discounted price only (ignoring buyer-paid shipping): 
          <strong> $2.95</strong> if discounted price is under <strong>$15</strong>, otherwise <strong>20%</strong>.
        </p>
      </section>
      <p className="opacity-70 text-sm">
        Built with Next.js 15 / React 19. This site avoids cookies where
        possible and aims to be fast and accessible.
      </p>
    </main>
  );
}
