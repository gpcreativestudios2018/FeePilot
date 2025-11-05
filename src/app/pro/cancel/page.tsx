import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pro – Checkout Canceled',
  description: 'Checkout canceled',
  alternates: { canonical: '/pro/cancel' },
};

export default function ProCancelPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout canceled</h1>
      <p className="opacity-80">
        No worries. You can try again any time.
      </p>
      <div className="flex gap-3">
        <Link href="/pro" className="underline underline-offset-4">
          Back to Pro
        </Link>
        <Link href="/" className="underline underline-offset-4">
          Go home
        </Link>
      </div>
    </main>
  );
}
