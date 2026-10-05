import { NextRequest } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/session";
import { getStripe as stripeClient } from "@/lib/entitlement";
import { rateLimit } from "@/lib/rate-limit";

function getStripe() {
  const s = stripeClient();
  if (!s) throw new Error("STRIPE_SECRET_KEY is not configured");
  return s;
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
    // Throttle Stripe session creation (each call hits the Stripe API).
    const rl = rateLimit(req, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: rl.message }, { status: 429, headers: rl.headers });

    // Require authentication — prevents anonymous bots from spamming Stripe
    // sessions, and (critically) lets us bind the session to the real user so
    // lib/entitlement.ts finds the subscription by the trusted Google id
    // rather than by the payer-typed billing email.
    let userId: string | undefined;
    let userEmail: string | undefined;
    if (isAuthConfigured) {
      const session = await getSession();
      if (!session) {
        return Response.json({ error: "Authentication required" }, { status: 401 });
      }
      userId = session.sub;
      userEmail = session.email;
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
      // Bind the subscription to the signed-in Google account (see lib/entitlement.ts).
      ...(userId
        ? {
            client_reference_id: userId,
            customer_email: userEmail,
            metadata: { google_sub: userId },
            subscription_data: { metadata: { google_sub: userId } },
          }
        : {}),
    });

    if (!session.url) {
      return Response.json({ error: "No session URL returned" }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[checkout] Stripe error:", message);
    // Don't leak raw Stripe/internal error strings to the client.
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
