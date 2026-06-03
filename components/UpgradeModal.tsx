"use client";
import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export type UpgradeFeature = "pdf_export" | "word_conversion";

interface Props {
  feature: UpgradeFeature;
  /** "sign_in_required" → show sign-in CTA; "upgrade_required" → show pricing CTA */
  reason?: "sign_in_required" | "upgrade_required";
  /** For word_conversion: how many conversions they've used vs limit */
  used?: number;
  limit?: number;
  onClose: () => void;
}

const FEATURE_COPY: Record<UpgradeFeature, { icon: string; title: string; free: string; pro: string }> = {
  pdf_export: {
    icon: "📄",
    title: "PDF Export",
    free: "PDF export is a Pro feature. Compile your LaTeX to a real PDF with one click — no local install needed.",
    pro: "PDF export is included in Pro. No compile timeouts. Ever.",
  },
  word_conversion: {
    icon: "↗",
    title: "Word → LaTeX",
    free: "You've used all 3 free conversions this month. Upgrade to Pro for unlimited Word → LaTeX conversions.",
    pro: "Unlimited Word → LaTeX conversions are included in Pro.",
  },
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function UpgradeModal({ feature, reason = "upgrade_required", used, limit, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef  = useRef<HTMLDivElement>(null);
  const copy = FEATURE_COPY[feature];
  const needsSignIn = reason === "sign_in_required";

  // Close on Escape; trap Tab focus inside the dialog
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter(el => el.offsetParent !== null); // skip hidden elements

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Move focus into modal on open; restore previous focus on close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Focus the first focusable element inside the dialog
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? overlayRef.current)?.focus();
    return () => prev?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Upgrade required for ${copy.title}`}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "2rem",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          animation: "slideIn 0.18s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{copy.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--fg)" }}>
                {needsSignIn ? "Sign in to continue" : "Upgrade to Pro"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: "0.1rem" }}>
                {copy.title}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--fg-muted)", fontSize: "1.2rem", lineHeight: 1,
              padding: "0.2rem", borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <p style={{ fontSize: "0.9rem", color: "var(--fg-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          {needsSignIn
            ? `Sign in (free) to access ${copy.title}. Free accounts get ${feature === "word_conversion" ? "3 Word → LaTeX conversions/month" : "unlimited preview and diff"}.`
            : copy.free}
        </p>

        {/* Usage bar (word conversion only) */}
        {feature === "word_conversion" && !needsSignIn && used !== undefined && limit !== undefined && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: "0.4rem" }}>
              <span>Conversions used this month</span>
              <span style={{ fontWeight: 600, color: "var(--red)" }}>{used} / {limit}</span>
            </div>
            <div style={{ background: "var(--surface2)", borderRadius: 6, height: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 6,
                width: `${Math.min(100, (used / limit) * 100)}%`,
                background: used >= limit ? "var(--red)" : "var(--accent)",
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        )}

        {/* Pro feature list */}
        {!needsSignIn && (
          <div style={{
            background: "color-mix(in srgb, var(--accent) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            borderRadius: 8,
            padding: "0.85rem 1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent2)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pro includes
            </div>
            {[
              feature === "pdf_export" ? "✓ PDF export — no timeouts" : "✓ Unlimited Word → LaTeX",
              "✓ All 13+ templates",
              "✓ Priority support (24 h)",
              "✓ $49 / year or $9 / month",
            ].map(f => (
              <div key={f} style={{ fontSize: "0.84rem", color: "var(--fg)", padding: "0.15rem 0" }}>{f}</div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {needsSignIn ? (
            <>
              <Link
                href="/auth"
                onClick={onClose}
                style={{
                  display: "block", textAlign: "center",
                  padding: "0.7rem 1.5rem",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                  boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                Sign in free →
              </Link>
              <button
                onClick={onClose}
                style={{
                  padding: "0.65rem",
                  background: "none", border: "none",
                  color: "var(--fg-muted)", fontSize: "0.85rem", cursor: "pointer",
                }}
              >
                Maybe later
              </button>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                onClick={onClose}
                style={{
                  display: "block", textAlign: "center",
                  padding: "0.7rem 1.5rem",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                  boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                Upgrade to Pro — $49 / year →
              </Link>
              <Link
                href="/auth"
                onClick={onClose}
                style={{
                  display: "block", textAlign: "center",
                  padding: "0.65rem",
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--fg-muted)", fontSize: "0.85rem", textDecoration: "none",
                }}
              >
                Sign in to manage your subscription
              </Link>
              <button
                onClick={onClose}
                style={{
                  padding: "0.5rem",
                  background: "none", border: "none",
                  color: "var(--fg-muted)", fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
