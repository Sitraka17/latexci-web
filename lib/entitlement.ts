/**
 * Plan lookup with Stripe as the single source of truth (no database).
 *
 * A subscription belongs to a user when its metadata carries their Google id
 * (set at checkout), or, for older subscriptions, when its Stripe customer has
 * the same email Google verified. Results are cached per instance for 5 min.
 */
import Stripe from "stripe";
import type { Session } from "@/lib/session";

export type Tier = "free" | "pro" | "lab" | "institution";

const PRICE_TO_TIER: Record<string, Tier> = Object.fromEntries(
  [
    [process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY, "pro"],
    [process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL, "pro"],
    [process.env.NEXT_PUBLIC_STRIPE_LAB_MONTHLY, "lab"],
    [process.env.NEXT_PUBLIC_STRIPE_LAB_ANNUAL, "lab"],
  ].filter(([id]) => !!id),
);

const RANK: Record<Tier, number> = { free: 0, pro: 1, lab: 2, institution: 3 };
const TTL = 5 * 60_000;
const cache = new Map<string, { tier: Tier; at: number }>();

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" });
  return stripe;
}

function tierOf(sub: Stripe.Subscription): Tier {
  if (sub.status !== "active" && sub.status !== "trialing") return "free";
  // Fail closed: an unknown price never grants a paid tier.
  return PRICE_TO_TIER[sub.items.data[0]?.price?.id ?? ""] ?? "free";
}

const best = (subs: Stripe.Subscription[]): Tier =>
  subs.map(tierOf).reduce<Tier>((a, b) => (RANK[b] > RANK[a] ? b : a), "free");

/** Without Stripe nobody can pay, so Pro-only features stay open to everyone. */
export const isBillingConfigured = !!process.env.STRIPE_SECRET_KEY;

export function isPaid(tier: Tier): boolean {
  return tier !== "free";
}

export async function getTier(session: Session, opts: { fresh?: boolean } = {}): Promise<Tier> {
  const hit = cache.get(session.sub);
  if (!opts.fresh && hit && Date.now() - hit.at < TTL) return hit.tier;

  const s = getStripe();
  if (!s) return "free";

  let tier: Tier = "free";
  try {
    const bySub = await s.subscriptions.search({
      query: `metadata['google_sub']:'${session.sub.replace(/'/g, "")}'`,
      limit: 10,
    });
    tier = best(bySub.data);
    if (tier === "free") {
      const customers = await s.customers.list({ email: session.email, limit: 5 });
      for (const c of customers.data) {
        const subs = await s.subscriptions.list({ customer: c.id, status: "all", limit: 10 });
        const t = best(subs.data);
        if (RANK[t] > RANK[tier]) tier = t;
      }
    }
  } catch (err) {
    console.error("[entitlement] Stripe lookup failed:", err instanceof Error ? err.message : err);
    // Keep a previously known paid tier through a Stripe hiccup.
    return hit?.tier ?? "free";
  }

  cache.set(session.sub, { tier, at: Date.now() });
  return tier;
}
