import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import AuthForm from "@/components/AuthForm";
import { isAuthConfigured } from "@/lib/session";

// Dynamic so the Google sign-in button appears as soon as the env vars are set,
// without waiting for a rebuild.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to latexci with your Google account.",
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.5rem",
        }}
      >
        <AuthForm configured={isAuthConfigured} />
      </main>
      <SiteFooter />
    </div>
  );
}
