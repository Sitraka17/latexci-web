"use client";
import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 9,
              overflow: "hidden",
              transition: "border-color 0.15s",
              ...(isOpen ? { borderColor: "var(--accent)" } : {}),
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                background: isOpen ? "var(--surface2)" : "var(--surface)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--fg)",
                fontSize: "0.91rem",
                fontWeight: 600,
                transition: "background 0.15s",
              }}
            >
              <span>{q}</span>
              <span
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  flexShrink: 0,
                  fontSize: "0.9rem",
                  color: "var(--fg-muted)",
                  transform: isOpen ? "rotate(45deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              >
                +
              </span>
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 0.22s ease",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    padding: "0.75rem 1.25rem 1rem",
                    background: "var(--surface)",
                    fontSize: "0.85rem",
                    color: "var(--fg-muted)",
                    lineHeight: 1.75,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
