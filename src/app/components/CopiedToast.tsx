'use client';

import React from 'react';

type CopiedToastProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Defaults to "Permalink copied!" */
  message?: string;
  /** Auto-hide in ms (default 1500) */
  duration?: number;
};

export default function CopiedToast({
  open,
  onOpenChange,
  message = 'Permalink copied!',
  duration = 1500,
}: CopiedToastProps) {
  // Auto-close after `duration` once opened
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onOpenChange(false), duration);
    return () => clearTimeout(t);
  }, [open, duration, onOpenChange]);

  // Prevent pointer events when hidden; basic fade/slide animation
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 24,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        role="status"
        style={{
          transform: open ? 'translateY(0px)' : 'translateY(8px)',
          opacity: open ? 1 : 0,
          transition: 'opacity 150ms ease, transform 150ms ease',
          pointerEvents: 'auto',
          background: 'var(--toast-bg, rgba(0,0,0,0.85))',
          color: 'var(--toast-fg, white)',
          padding: '10px 14px',
          borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          fontSize: 14,
          lineHeight: 1.2,
          // Light/Dark theming via CSS variables (optional)
        }}
      >
        {message}
      </div>
    </div>
  );
}
