'use client';

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10">
      {/* Simple nav row with typed routes, including About */}
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-400">
        <Link
          href={'/' as Route}
          className="opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Home
        </Link>
        <span className="opacity-30">•</span>
        <Link
          href={'/pro' as Route}
          className="opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Pro
        </Link>
        <span className="opacity-30">•</span>
        {/* Route Reverse calculator to /pro (Pro-only overview), not /pro/target */}
        <Link
          href={'/pro' as Route}
          className="opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Reverse calculator <span className="rounded-full border px-2 py-0.5 text-[10px] align-middle opacity-70">Pro</span>
        </Link>
        <span className="opacity-30">•</span>
        <Link
          href={'/about' as Route}
          className="opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
        >
          About
        </Link>
        <span className="opacity-30">•</span>
        <Link
          href={'/docs' as Route}
          className="opacity-80 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Docs
        </Link>
      </nav>

      {/* Your existing content, kept (with docs now pointing to /docs above) */}
      <div className="flex flex-col items-center gap-2 text-sm text-neutral-400">
        <div className="text-center">
          FeePilot by GP Creative Studios{' '}
          <a
            href="mailto:gpcreativestudios2018@gmail.com"
            className="underline decoration-dotted hover:text-purple-400"
          >
            (contact)
          </a>{' '}
          <a
            href="https://github.com/gpcreativestudios2018/FeePilot/blob/main/docs/command-palette.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-purple-400"
          >
            (docs)
          </a>
        </div>
      </div>
    </footer>
  );
}
