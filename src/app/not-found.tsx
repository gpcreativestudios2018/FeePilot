// src/app/not-found.tsx
import Link from 'next/link';

type Route = '/' | '/pro' | '/about' | '/docs';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="opacity-80" suppressHydrationWarning>
        The page you requested does not exist.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={'/' as Route}
          className="rounded-full border border-purple-600/50 px-4 py-2 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-400/60"
        >
          Go to Home
        </Link>
        <Link
          href={'/pro' as Route}
          className="rounded-full border border-purple-600/50 px-4 py-2 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-400/60"
        >
          Explore Pro
        </Link>
        <Link
          href={'/docs' as Route}
          className="rounded-full border border-purple-600/50 px-4 py-2 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-400/60"
        >
          Read the Docs
        </Link>
      </div>
    </main>
  );
}
