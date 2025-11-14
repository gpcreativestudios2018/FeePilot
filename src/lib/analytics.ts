// Lightweight analytics helper: sends events to Plausible (if present)
// and mirrors to Google Analytics 4 (if NEXT_PUBLIC_GA_ID is configured).

type Props = Record<string, unknown>;

function toGaEventName(name: string) {
  // Keep GA event naming simple: lowercase, spaces -> underscore
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function track(eventName: string, props?: Props) {
  // Plausible
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible(eventName, props ? { props } : undefined);
    }
  } catch {
    // no-op
  }

  // Google Analytics 4
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', toGaEventName(eventName), props || {});
    }
  } catch {
    // no-op
  }
}

// Convenience helpers (optional)
export const Analytics = {
  track,
};
