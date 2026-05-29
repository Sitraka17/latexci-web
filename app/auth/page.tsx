import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in — latexci",
  description: "Sign in to save your LaTeX documents and sync across devices.",
  robots: { index: false, follow: false },
};

export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  void searchParams; // resolved in AuthForm via client-side URLSearchParams
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
        <AuthForm />
      </main>
      <SiteFooter />
    </div>
  );
}
