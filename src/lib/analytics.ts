// Lightweight Plausible wrapper.
// No-ops on server, in dev, or if Plausible isn’t enabled.

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function track(eventName: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return; // SSR / build
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) return; // only in prod with domain set
  try {
    window.plausible?.(eventName, props ? { props } : undefined);
  } catch {
    // never block UI
  }
}
