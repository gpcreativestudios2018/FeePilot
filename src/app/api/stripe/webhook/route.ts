import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use Node runtime (Stripe needs it)
export const runtime = 'nodejs';

// Avoid static generation for this route
export const dynamic = 'force-dynamic';

// Read secrets (may be undefined at build time; that's OK)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const secretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe sends a raw body. In the App Router we can read it as text(),
 * then verify the signature header.
 */
export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const raw = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    if (webhookSecret && secretKey) {
      // Construct the Stripe client lazily at request-time (not module scope)
      const stripe = new Stripe(secretKey);
      event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
    } else {
      // Dev/preview fallback: accept without verify if secrets are missing
      console.warn(
        '[stripe] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET; accepting event without verify (dev/preview only)'
      );
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[stripe] Webhook signature verification failed:', message);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // Minimal handler for now — just log what we’d act on later.
  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.paid':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      console.log('[stripe] event:', event.type, { id: event.id });
      break;
    default:
      // Ignore other events for now
      break;
  }

  return NextResponse.json({ received: true });
}
