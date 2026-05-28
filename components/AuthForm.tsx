"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";
type Stage = "input" | "sent";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("magic");
  const [stage, setStage] = useState<Stage>("input");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show error from URL param (e.g. after failed OAuth callback)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("error")) setError("Authentication failed. Please try again.");
  }, []);

  const supabase = createClient();

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setStage("sent");
    setLoading(false);
  }

  async function handlePassword() {
    setLoading(true);
    setError(null);
    const fn = isSignUp
      ? supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await fn;
    if (error) { setError(error.message); setLoading(false); return; }
    if (isSignUp) { setStage("sent"); setLoading(false); return; }
    window.location.href = "/dashboard";
  }

  async function handleGitHub() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (stage === "sent") {
    return (
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📬</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>Check your inbox</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>
          We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--fg)",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem",
    borderRadius: 8,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  const btnSecondary: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--fg)",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  };

  return (
    <div style={{ maxWidth: 420, width: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.4rem" }}>
          {isSignUp ? "Create an account" : "Welcome back"}
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          {isSignUp ? "Save and sync your LaTeX documents for free." : "Sign in to access your documents."}
        </p>
      </div>

      {/* OAuth buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button style={btnSecondary} onClick={handleGitHub} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>
        <button style={btnSecondary} onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
            <path d="M6.3 14.7l7 5.1C15.1 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" fill="#FF3D00"/>
            <path d="M24 46c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.7 36.9 27 38 24 38c-6.1 0-11.2-4.1-13-9.6l-7 5.4C7.5 41.6 15.2 46 24 46z" fill="#4CAF50"/>
            <path d="M44.5 20H24v8.5h11.8c-.8 2.5-2.5 4.5-4.7 5.9l6.6 5.6c3.8-3.6 6.3-9 6.3-16 0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>or email</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: "1.25rem", overflow: "hidden" }}>
        {(["magic", "password"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: "0.5rem", border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600,
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--fg-muted)",
            }}
          >
            {m === "magic" ? "✨ Magic link" : "🔑 Password"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        <input
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") mode === "magic" ? handleMagicLink() : handlePassword(); }}
          style={inputStyle}
          autoComplete="email"
        />

        {mode === "password" && (
          <input
            type="password"
            placeholder={isSignUp ? "Create a password" : "Password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handlePassword(); }}
            style={inputStyle}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        )}

        {error && (
          <p style={{ fontSize: "0.8rem", color: "#ef4444", margin: 0 }}>{error}</p>
        )}

        <button
          style={btnPrimary}
          onClick={mode === "magic" ? handleMagicLink : handlePassword}
          disabled={loading || !email}
        >
          {loading ? "Please wait…" : mode === "magic" ? "Send magic link" : isSignUp ? "Create account" : "Sign in"}
        </button>

        {mode === "password" && (
          <button
            onClick={() => setIsSignUp(s => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--fg-muted)", padding: 0 }}
          >
            {isSignUp ? "Already have an account? Sign in" : "No account? Create one free"}
          </button>
        )}
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.72rem", color: "var(--fg-muted)", textAlign: "center", lineHeight: 1.6 }}>
        By continuing you agree to our{" "}
        <a href="/terms" style={{ color: "var(--accent)" }}>Terms</a> and{" "}
        <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
      </p>
    </div>
  );
}
