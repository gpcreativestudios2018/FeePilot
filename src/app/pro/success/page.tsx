import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pro – Payment Success',
  description: 'Thanks for upgrading to Pro!',
  alternates: { canonical: '/pro/success' },
};

export default function ProSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">You’re all set 🎉</h1>
      <p className="opacity-80">
        Thanks for upgrading. If your account isn’t showing Pro features yet,
        it’ll update shortly after we confirm your payment.
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
