'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-sm text-neutral-400">
        <div className="text-center">
          FeePilot by GP Creative Studios{' '}
          <a
            href="mailto:gpcreativestudios2018@gmail.com"
            className="underline decoration-dotted hover:text-purple-400"
          >
            (contact)
          </a>
          {' '}
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
