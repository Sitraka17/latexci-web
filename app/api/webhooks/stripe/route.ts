/**
 * POST /api/webhooks/stripe
 *
 * Stripe is the source of truth for plans (lib/entitlement.ts reads it on
 * demand), so there is nothing to write anywhere. The endpoint stays so the
 * events already configured in the Stripe dashboard keep getting a verified
 * 200, and so subscription changes show up in the logs.
 */
import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { getStripe } from "@/lib/entitlement";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();
  if (!webhookSecret || !stripe) return new Response("Stripe not configured", { status: 500 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature error";
    console.error("[webhook] Signature failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    console.log("[webhook]", event.type, sub.id, sub.status, sub.metadata?.google_sub ?? "(no google_sub)");
  } else if (event.type === "invoice.payment_failed") {
    console.warn("[webhook] invoice payment failed", (event.data.object as Stripe.Invoice).id);
  }

  return Response.json({ received: true });
}
