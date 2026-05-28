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

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const BASE_URL = getBaseUrl();
    const { priceId } = (await req.json()) as { priceId: string };

    if (!priceId || typeof priceId !== "string") {
      return Response.json({ error: "Missing priceId" }, { status: 400 });
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
