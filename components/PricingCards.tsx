"use client";
import { useState } from "react";
import Link from "next/link";

/* ─── Plan definitions ──────────────────────────────────────────────── */

const PLANS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    annualTotal: 0,
    monthlyPriceId: null,
    annualPriceId: null,
    badge: null,
    description: "Everything you need to start writing LaTeX today.",
    cta: "Start for free",
    ctaHref: "/tools/preview",
    ctaExternal: false,
    highlight: false,
    features: [
      { text: "LaTeX preview — unlimited", included: true },
      { text: "LaTeX diff — unlimited", included: true },
      { text: "LaTeX table generator", included: true },
      { text: "6 LaTeX templates", included: true },
      { text: "Word → LaTeX conversions", included: true, note: "3 / month" },
      { text: "PDF export", included: false },
      { text: "Priority support", included: false },
      { text: "Shared team templates", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 15,
    annualPrice: 11,   // $129/yr ÷ 12 ≈ $10.75, shown as 11
    annualTotal: 129,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY ?? "price_pro_monthly",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL ?? "price_pro_annual",
    badge: "Most Popular",
    description: "For postdocs, academic editors, and independent researchers.",
    cta: "Start Pro",
    ctaHref: null,
    ctaExternal: false,
    highlight: true,
    features: [
      { text: "LaTeX preview — unlimited", included: true },
      { text: "LaTeX diff — unlimited", included: true },
      { text: "LaTeX table generator", included: true },
      { text: "All LaTeX templates", included: true },
      { text: "Word → LaTeX conversions — unlimited", included: true },
      { text: "PDF export", included: true },
      { text: "Priority support (24 h)", included: true },
      { text: "Shared team templates", included: false },
    ],
  },
  {
    key: "lab",
    name: "Lab",
    monthlyPrice: 49,
    annualPrice: 37,   // $449/yr ÷ 12 ≈ $37.4
    annualTotal: 449,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_LAB_MONTHLY ?? "price_lab_monthly",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_LAB_ANNUAL ?? "price_lab_annual",
    badge: "Teams",
    description: "For PI groups and research labs — 5 seats included.",
    cta: "Start Lab",
    ctaHref: null,
    ctaExternal: false,
    highlight: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "5 seats included", included: true },
      { text: "Shared team templates", included: true },
      { text: "Admin dashboard", included: true },
      { text: "Institutional invoicing", included: true },
      { text: "SSO / SAML (on request)", included: true },
      { text: "Priority support (4 h)", included: true },
      { text: "Grant-fundable — budget line available", included: true },
    ],
  },
];

/* ─── Checkout helper ───────────────────────────────────────────────── */

async function startCheckout(priceId: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error("Checkout failed");
  const { url } = await res.json();
  window.location.href = url;
}

/* ─── Feature row ───────────────────────────────────────────────────── */

function FeatureRow({ text, included, note }: { text: string; included: boolean; note?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
        padding: "0.45rem 0",
        borderBottom: "1px solid var(--border)",
        opacity: included ? 1 : 0.38,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: included ? "color-mix(in srgb, #10b981 18%, transparent)" : "color-mix(in srgb, var(--fg) 8%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          color: included ? "#10b981" : "var(--fg-muted)",
          marginTop: 1,
        }}
      >
        {included ? "✓" : "✕"}
      </span>
      <span style={{ fontSize: "0.83rem", color: "var(--fg)", lineHeight: 1.45 }}>
        {text}
        {note && (
          <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--fg-muted)", fontStyle: "italic" }}>
            ({note})
          </span>
        )}
      </span>
    </div>
  );
}

/* ─── Plan card ─────────────────────────────────────────────────────── */

function PlanCard({ plan, annual }: { plan: typeof PLANS[number]; annual: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;

  async function handleCheckout() {
    if (!priceId) return;
    setLoading(true);
    setError(null);
    try {
      await startCheckout(priceId);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        background: plan.highlight ? "var(--accent)" : "var(--surface)",
        border: plan.highlight
          ? "2px solid var(--accent)"
          : "1px solid var(--border)",
        borderRadius: 14,
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: plan.highlight ? "0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent)" : "none",
        color: plan.highlight ? "#fff" : "var(--fg)",
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: plan.highlight ? "#fff" : "var(--accent)",
            color: plan.highlight ? "var(--accent)" : "#fff",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            padding: "0.2rem 0.85rem",
            borderRadius: 99,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: plan.highlight ? 0.85 : 0.55,
            marginBottom: "0.4rem",
          }}
        >
          {plan.name}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
          <span style={{ fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            ${price}
          </span>
          <span style={{ fontSize: "0.82rem", opacity: 0.65 }}>/ mo</span>
        </div>
        {annual && plan.annualTotal > 0 && (
          <p style={{ fontSize: "0.76rem", opacity: 0.65, marginTop: "0.25rem" }}>
            Billed ${plan.annualTotal}/yr — save ${(plan.monthlyPrice * 12) - plan.annualTotal}
          </p>
        )}
        <p
          style={{
            fontSize: "0.84rem",
            lineHeight: 1.55,
            marginTop: "0.75rem",
            opacity: plan.highlight ? 0.9 : 0.7,
          }}
        >
          {plan.description}
        </p>
      </div>

      {/* CTA */}
      {plan.ctaHref ? (
        <Link
          href={plan.ctaHref}
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.7rem 1rem",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            background: plan.highlight ? "#fff" : "var(--accent)",
            color: plan.highlight ? "var(--accent)" : "#fff",
            transition: "opacity 0.15s",
          }}
        >
          {plan.cta}
        </Link>
      ) : (
        <>
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              padding: "0.7rem 1rem",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              cursor: loading ? "wait" : "pointer",
              background: plan.highlight ? "#fff" : "var(--accent)",
              color: plan.highlight ? "var(--accent)" : "#fff",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Redirecting…" : plan.cta}
          </button>
          {error && (
            <p style={{ fontSize: "0.78rem", color: plan.highlight ? "#fca5a5" : "#ef4444", textAlign: "center", margin: 0 }}>
              {error}
            </p>
          )}
        </>
      )}

      {/* Features */}
      <div
        style={{
          borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.25)" : "var(--border)"}`,
          paddingTop: "1rem",
          // Override feature row colors when highlight
          ...(plan.highlight
            ? { "--border": "rgba(255,255,255,0.2)", "--fg": "#fff", "--fg-muted": "rgba(255,255,255,0.65)" } as React.CSSProperties
            : {}),
        }}
      >
        {plan.features.map((f) => (
          <FeatureRow key={f.text} text={f.text} included={f.included} note={"note" in f ? f.note : undefined} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────── */

export default function PricingCards() {
  const [annual, setAnnual] = useState(true); // default annual — converts better

  return (
    <div>
      {/* Billing toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "3rem",
        }}
      >
        <button
          onClick={() => setAnnual(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontWeight: annual ? 400 : 700,
            color: annual ? "var(--fg-muted)" : "var(--fg)",
            padding: "0.3rem 0",
          }}
        >
          Monthly
        </button>

        {/* Toggle pill */}
        <button
          aria-label={`Switch to ${annual ? "monthly" : "annual"} billing`}
          onClick={() => setAnnual((a) => !a)}
          style={{
            position: "relative",
            width: 46,
            height: 26,
            borderRadius: 13,
            background: annual ? "var(--accent)" : "var(--border)",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: annual ? 23 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </button>

        <button
          onClick={() => setAnnual(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontWeight: annual ? 700 : 400,
            color: annual ? "var(--fg)" : "var(--fg-muted)",
            padding: "0.3rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          Annual
          <span
            style={{
              background: "color-mix(in srgb, #10b981 15%, transparent)",
              color: "#10b981",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "0.12rem 0.45rem",
              borderRadius: 99,
              border: "1px solid color-mix(in srgb, #10b981 30%, transparent)",
            }}
          >
            Save 28%
          </span>
        </button>
      </div>

      {/* Cards grid */}
      <div
        className="pricing-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {PLANS.map((plan) => (
          <PlanCard key={plan.key} plan={plan} annual={annual} />
        ))}
      </div>

      {/* Enterprise row */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem 1.75rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" }}>Institution</p>
          <p style={{ fontSize: "0.83rem", color: "var(--fg-muted)", margin: 0 }}>
            SSO, unlimited users, PO billing, SLA. Starting at $2,000/yr.
          </p>
        </div>
        <a
          href="mailto:hello@latexci.com?subject=Institution%20Plan"
          style={{
            padding: "0.55rem 1.25rem",
            borderRadius: 8,
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--fg)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Contact us →
        </a>
      </div>

      {/* Grant note */}
      <p
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.78rem",
          color: "var(--fg-muted)",
        }}
      >
        Lab and Institution plans are grant-fundable.{" "}
        <a
          href="mailto:hello@latexci.com?subject=Grant%20budget%20line"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          Request a budget line template →
        </a>
      </p>

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
