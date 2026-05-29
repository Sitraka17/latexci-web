import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import PricingCards from "@/components/PricingCards";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://latexci-web.vercel.app";

export const metadata: Metadata = {
  title: "Pricing — latexci Pro & Lab Plans",
  description:
    "Upgrade to latexci Pro ($129/yr) for unlimited Word→LaTeX conversions and PDF export. Lab plan ($449/yr) for 5-seat research groups. No compile timeouts. Ever.",
  keywords: [
    "latex subscription", "latex pro plan", "latex editor pricing",
    "overleaf alternative pricing", "academic latex tool", "research lab latex",
  ],
  alternates: { canonical: `${BASE}/pricing` },
  openGraph: {
    title: "latexci Pricing — Pro & Lab Plans for Academics",
    description: "No compile timeouts. Ever. Pro at $129/yr or Lab at $449/yr for 5 seats.",
    url: `${BASE}/pricing`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "latexci Pricing" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is latexci different from Overleaf?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "latexci is a browser-based toolset (preview, diff, Word conversion, table generator) that works without a LaTeX installation. It's not a full IDE, so it's faster to open and ideal for quick checks, sharing previews, and converting documents.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Pro plan grant-fundable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Lab and Institution plans come with an official invoice and a sample budget justification you can include in NSF, NIH, or ERC grant applications under 'software tools' or 'publication costs'.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel at any time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Cancel any time from your account settings. Your plan stays active until the end of the billing period — no pro-rated refunds on annual plans.",
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        {/* Hero */}
        <div
          className="has-grid"
          style={{
            textAlign: "center",
            padding: "5rem 1.5rem 3.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
            }}
          >
            Simple, transparent pricing
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "1rem",
              color: "var(--fg)",
            }}
          >
            No compile timeouts.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Ever.
            </span>
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--fg-muted)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Free to start. Upgrade when you need unlimited Word conversions,
            PDF export, or seats for your whole lab.
          </p>
        </div>

        {/* Pricing cards */}
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            padding: "0 1.5rem 5rem",
          }}
        >
          <PricingCards />
        </div>

        {/* Trust strip */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "3rem 1.5rem",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "2rem",
              textAlign: "center",
            }}
          >
            {[
              { icon: "🔒", title: "Stripe-secured", body: "Payments handled by Stripe. We never see your card number." },
              { icon: "📄", title: "Instant invoice", body: "PDF receipt on purchase. Lab & Institution plans include VAT invoices." },
              { icon: "🎓", title: "Academic focus", body: "Built for researchers, by researchers. Free tier will always exist." },
              { icon: "⚡", title: "Cancel anytime", body: "No lock-in. Cancel from settings, active until period ends." },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{item.icon}</div>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.3rem" }}>{item.title}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: 1.55, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "4rem 1.5rem 5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            Questions
          </h2>
          {faqSchema.mainEntity.map((q) => (
            <div
              key={q.name}
              style={{
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>{q.name}</p>
              <p style={{ fontSize: "0.86rem", color: "var(--fg-muted)", lineHeight: 1.7, margin: 0 }}>
                {q.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
