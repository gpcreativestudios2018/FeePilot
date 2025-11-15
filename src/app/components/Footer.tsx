'use client';

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { track } from '@/lib/analytics';

export default function Footer() {
  const supportUrl =
    process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://www.buymeacoffee.com/';

  const onSupportClick = () => {
    track('Support Click', { href: supportUrl });
  };

  return (
    <footer className="mx-auto max-w-6xl px-4 py-10">
      {/* Nav row with pill-style links, matching the top-right home pills */}
      <nav className="mb-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href={'/' as Route}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
        >
          Home
        </Link>

        <Link
          href={'/pro' as Route}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
        >
          Pro
        </Link>

        {/* Route Reverse calculator to /pro (Pro-only overview), not /pro/target */}
        <Link
          href={'/pro' as Route}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
        >
          <span className="mr-2">Reverse calculator</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] align-middle opacity-70">
            Pro
          </span>
        </Link>

        <Link
          href={'/about' as Route}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
        >
          About
        </Link>

        <Link
          href={'/docs' as Route}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
        >
          Docs
        </Link>

        <a
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSupportClick}
          className="inline-flex items-center rounded-full border px-4 py-2 text-base select-none border-purple-600/50 text-white transition hover:bg-white/5"
          title="Support the project"
          aria-label="Support the project"
        >
          Support the project
        </a>
      </nav>

      {/* Existing metadata / links */}
      <div className="flex flex-col items-center gap-2 text-sm text-neutral-400">
        <div className="text-center">
          FeePilot by{' '}
          <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-purple-500 bg-clip-text text-transparent">
            GP Creative Studios
          </span>{' '}
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
