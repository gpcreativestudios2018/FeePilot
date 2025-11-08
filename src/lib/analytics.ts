// Lightweight Plausible wrapper used across the app.
// No-ops on server, in dev, or if Plausible isn’t enabled.

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function track(eventName: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return; // SSR / build
  // Only send if Plausible is configured in prod
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) return;

  try {
    window.plausible?.(eventName, props ? { props } : undefined);
  } catch {
    // swallow — analytics should never break UX
  }
}
