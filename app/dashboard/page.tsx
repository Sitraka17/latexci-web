import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import DashboardClient from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your LaTeX documents saved in this browser, and your latexci account.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1000, width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.75rem" }}>Dashboard</h1>
        <DashboardClient />
      </main>
      <SiteFooter />
    </div>
  );
}
