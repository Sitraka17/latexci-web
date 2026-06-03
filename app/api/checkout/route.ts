import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Lazy getter — only instantiated at request time, never at build time
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
  });
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

const ALLOWED_PRICE_IDS = new Set([
  process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY,
  process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL,
  process.env.NEXT_PUBLIC_STRIPE_LAB_MONTHLY,
  process.env.NEXT_PUBLIC_STRIPE_LAB_ANNUAL,
].filter(Boolean));

export async function POST(req: NextRequest) {
  try {
    // Require authentication — prevents anonymous bots from spamming Stripe sessions
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return Response.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    const stripe = getStripe();
    const BASE_URL = getBaseUrl();
    const { priceId } = (await req.json()) as { priceId: string };

    if (!priceId || typeof priceId !== "string") {
      return Response.json({ error: "Missing priceId" }, { status: 400 });
    }

    if (ALLOWED_PRICE_IDS.size > 0 && !ALLOWED_PRICE_IDS.has(priceId)) {
      return Response.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // Automatically collect tax via Stripe Tax (enable in dashboard)
      automatic_tax: { enabled: false },
    });

    if (!session.url) {
      return Response.json({ error: "No session URL returned" }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[checkout] Stripe error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
