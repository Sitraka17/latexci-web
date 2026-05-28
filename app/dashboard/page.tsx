import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import DashboardClient, { type SharedDoc } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — latexci",
  description: "Your saved LaTeX documents.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Load profile, own docs, and docs shared with me — in parallel
  const [{ data: profile }, { data: documents }, { data: sharedRaw }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("documents")
      .select("id, title, updated_at, is_pinned, tags, is_public")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("document_collaborators")
      .select(`
        document_id,
        permission,
        documents (
          id, title, share_token, updated_at,
          profiles ( display_name, email )
        )
      `)
      .eq("email", user.email ?? "")
      .limit(20),
  ]);

  const tier = profile?.subscription_tier ?? "free";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1000, width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.2rem" }}>
              Your documents
            </h1>
            <p style={{ fontSize: "0.83rem", color: "var(--fg-muted)", margin: 0 }}>
              {user.email} · <span style={{
                background: tier === "free" ? "var(--surface2)" : "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: tier === "free" ? "var(--fg-muted)" : "var(--accent)",
                padding: "0.1rem 0.5rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{tier}</span>
            </p>
          </div>
          <Link
            href="/tools/preview"
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
            }}
          >
            + New document
          </Link>
        </div>

        {/* Upgrade banner for free tier */}
        {tier === "free" && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <p style={{ fontSize: "0.85rem", color: "var(--fg)", margin: 0 }}>
              <strong>Free plan</strong> — upgrade to Pro for unlimited Word→LaTeX conversions, PDF export, and priority support.
            </p>
            <Link href="/pricing" style={{
              padding: "0.45rem 1rem",
              borderRadius: 7,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}>
              See pricing →
            </Link>
          </div>
        )}

        {/* Document list + shared with me */}
        <DashboardClient
          userId={user.id}
          initialDocuments={documents ?? []}
          sharedWithMe={(sharedRaw ?? []) as SharedDoc[]}
        />

      </main>

      <SiteFooter />
    </div>
  );
}
