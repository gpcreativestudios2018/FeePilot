import type { Metadata } from 'next';
import DocsAdSlot from './DocsAdSlot';

export const metadata: Metadata = {
  // Inherit page metadata; no overrides needed for layout
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  // Render the docs content, then a single ad slot.
  // DocsAdSlot is a no-op if env vars are missing or in non-prod.
  return (
    <div suppressHydrationWarning>
      {children}
      <DocsAdSlot />
    </div>
  );
}
