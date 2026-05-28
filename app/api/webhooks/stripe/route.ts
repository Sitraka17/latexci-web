import Stripe from "stripe";
import { NextRequest } from "next/server";

// Lazy getter — only instantiated at request time, never at build time
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
  });
}

/**
 * Stripe sends the raw body for signature verification — Next.js must NOT
 * parse it. We read the raw buffer ourselves.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("STRIPE_WEBHOOK_SECRET is not configured", { status: 500 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] Signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[webhook] Checkout completed:", session.id, "customer:", session.customer);
        // TODO: provision access — store session.customer + session.subscription
        //       in your DB (Supabase, PlanetScale, etc.) keyed on customer email
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status; // active | trialing | past_due | canceled
        console.log("[webhook] Subscription", event.type, sub.id, "status:", status);
        // TODO: update user's subscription status in DB
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("[webhook] Subscription cancelled:", sub.id);
        // TODO: downgrade user to free tier in DB
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[webhook] Payment succeeded for invoice:", invoice.id);
        // TODO: reset usage counters (e.g. Word conversion count) if applicable
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("[webhook] Payment failed for invoice:", invoice.id);
        // TODO: email user about failed payment / put subscription in past_due
        break;
      }

      default:
        // Unhandled event type — safe to ignore
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
