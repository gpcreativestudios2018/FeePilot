/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

type Props = {
  onShare: () => Promise<string>;
  onCopy: () => Promise<string>;
  /** URL the “Pro” button should open (e.g. your GitHub). */
  proHref?: string;
};

export default function HeaderActions({ onShare, onCopy, proHref }: Props) {
  const ring =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm ${ring}`}
        onClick={onShare}
        aria-label="Share"
        title="Share"
      >
        Share
      </button>

      <button
        type="button"
        className={`rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm ${ring}`}
        onClick={onCopy}
        aria-label="Copy link"
        title="Copy link"
      >
        Copy
      </button>

      <a
        href={proHref ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-xl border border-purple-600/60 bg-purple-600/15 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-600/25 ${ring}`}
        aria-label="Pro"
        title="Pro"
      >
        Pro
      </a>
    </div>
  );
}
