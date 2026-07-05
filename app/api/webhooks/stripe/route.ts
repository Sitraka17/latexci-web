import Stripe from "stripe";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import type { Database, SubscriptionTier, SubscriptionStatus } from "@/lib/supabase/types";

// ── Lazy Stripe getter (build-safe) ─────────────────────────────────────────
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" });
}

// ── Supabase admin client (service_role — bypasses RLS) ─────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createSupabaseAdmin<Database>(url, key);
}

// ── Map Stripe price IDs → tiers ─────────────────────────────────────────────
const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY  ?? "price_pro_monthly"]:  "pro",
  [process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL   ?? "price_pro_annual"]:   "pro",
  [process.env.NEXT_PUBLIC_STRIPE_LAB_MONTHLY  ?? "price_lab_monthly"]:  "lab",
  [process.env.NEXT_PUBLIC_STRIPE_LAB_ANNUAL   ?? "price_lab_annual"]:   "lab",
};

function tierFromSubscription(sub: Stripe.Subscription): SubscriptionTier {
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const tier = PRICE_TO_TIER[priceId];
  if (!tier) {
    // Fail CLOSED: an unknown/misconfigured price must never silently grant a
    // paid tier. Default to free and surface the misconfiguration in logs.
    console.error("[webhook] Unknown priceId — refusing to grant paid tier, defaulting to 'free':", priceId);
  }
  return tier ?? "free";
}

/**
 * Resolve which profile a subscription event targets. Prefer the trusted
 * Supabase user id carried in subscription metadata (set at checkout time);
 * fall back to the Stripe customer id binding. Never key off a payer-typed
 * email — that lets an attacker bind a customer to someone else's account.
 */
function subscriptionTarget(sub: Stripe.Subscription): { col: "id" | "stripe_customer_id"; val: string } {
  const userId = sub.metadata?.supabase_user_id;
  if (userId) return { col: "id", val: userId };
  return { col: "stripe_customer_id", val: sub.customer as string };
}

// ── Webhook handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("STRIPE_WEBHOOK_SECRET not set", { status: 500 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature error";
    console.error("[webhook] Signature failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();

    switch (event.type) {

      // ── First checkout complete ──────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        // Bind the Stripe customer to the profile by TRUSTED Supabase user id
        // (set as client_reference_id/metadata at checkout time), never by the
        // payer-supplied billing email — that is spoofable and enables
        // account-takeover / subscription-hijack.
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
        if (!customerId || !userId) {
          console.error("[webhook] checkout.session.completed missing customerId/userId:", session.id);
          break;
        }

        const { error: e1 } = await db
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);
        if (e1) console.error("[webhook] checkout.session.completed — profile update failed:", e1.message);

        console.log("[webhook] checkout.session.completed", session.id);
        break;
      }

      // ── Subscription created / updated ───────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tier = tierFromSubscription(sub);
        const status = sub.status as SubscriptionStatus;
        // cancel_at is the explicit end date when set; otherwise null (subscription auto-renews)
        const periodEnd = sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null;

        const target = subscriptionTarget(sub);
        const { error: e2 } = await db
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_status: status,
            subscription_period_end: periodEnd,
          })
          .eq(target.col, target.val);
        if (e2) {
          console.error("[webhook] subscription upsert failed:", e2.message, { sub: sub.id, target });
          return new Response("DB update failed", { status: 500 }); // Force Stripe retry
        }

        console.log("[webhook] subscription upserted", sub.id, tier, status);
        break;
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const target = subscriptionTarget(sub);

        const { error: e3 } = await db
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            subscription_period_end: null,
          })
          .eq(target.col, target.val);
        if (e3) {
          console.error("[webhook] subscription cancel failed:", e3.message, { sub: sub.id, target });
          return new Response("DB update failed", { status: 500 }); // Force Stripe retry
        }

        console.log("[webhook] subscription cancelled", sub.id);
        break;
      }

      // ── Successful renewal ───────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Reset monthly Word-conversion counter on every successful billing cycle
        const { error: e4 } = await db
          .from("profiles")
          .update({ word_conversions_this_month: 0 })
          .eq("stripe_customer_id", customerId);
        if (e4) console.error("[webhook] invoice.payment_succeeded counter reset failed:", e4.message);

        console.log("[webhook] invoice paid, counters reset", invoice.id);
        break;
      }

      // ── Failed payment ───────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error: e5 } = await db
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        if (e5) console.error("[webhook] invoice.payment_failed status update failed:", e5.message);

        console.warn("[webhook] invoice payment failed", invoice.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
