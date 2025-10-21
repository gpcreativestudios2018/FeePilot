'use client';
import React from 'react';

export default function Error(
  { error, reset }: { error: Error & { digest?: string }; reset: () => void }
) {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm opacity-80">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded-md px-3 py-2 ring-1 ring-gray-400/50 hover:bg-white/5 transition"
      >
        Try again
      </button>
    </main>
  );
}
