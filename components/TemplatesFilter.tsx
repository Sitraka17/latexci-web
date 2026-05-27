"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import LZString from "lz-string";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";

export default function TemplatesFilter() {
  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () => (active === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === active)),
    [active]
  );

  const countFor = (cat: string) =>
    cat === "All" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === cat).length;

  return (
    <>
      {/* ── Filter pills ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "0.45rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
          alignItems: "center",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.28rem 0.8rem",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: isActive ? 600 : 400,
                background: isActive
                  ? "var(--accent)"
                  : "var(--surface)",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                color: isActive ? "#fff" : "var(--fg-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--fg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--fg-muted)";
                }
              }}
            >
              {cat}
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "0.05rem 0.38rem",
                  borderRadius: 999,
                  background: isActive
                    ? "rgba(255,255,255,0.22)"
                    : "var(--surface2)",
                  color: isActive ? "#fff" : "var(--fg-muted)",
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {countFor(cat)}
              </span>
            </button>
          );
        })}

        {active !== "All" && (
          <span
            style={{
              fontSize: "0.76rem",
              color: "var(--fg-muted)",
              marginLeft: "0.25rem",
            }}
          >
            {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Template grid ────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {filtered.map((t) => {
          const encoded = LZString.compressToEncodedURIComponent(t.source);
          const href = `/tools/preview#s=${encoded}`;
          return (
            <article
              key={t.id}
              className="template-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "1.4rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "0.15rem",
                }}
              >
                <span style={{ fontSize: "1.6rem", lineHeight: 1 }} aria-hidden="true">
                  {t.icon}
                </span>
                <span
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: 600,
                    padding: "0.17rem 0.5rem",
                    borderRadius: 999,
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: "var(--fg-muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t.category}
                </span>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--fg)",
                  lineHeight: 1.3,
                }}
              >
                {t.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "var(--fg-muted)",
                  lineHeight: 1.65,
                  flex: 1,
                }}
              >
                {t.desc}
              </p>

              <Link
                href={href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  padding: "0.52rem 1rem",
                  borderRadius: 7,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  textDecoration: "none",
                  marginTop: "0.5rem",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Open in Preview →
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
