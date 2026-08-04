"use client";
import { useSyncExternalStore } from "react";

// The <html> class list (set pre-hydration by the anti-flash script in
// app/layout.tsx, and by toggle() below) is the single source of truth.
// useSyncExternalStore subscribes to it directly instead of copying it into
// component state from an effect — this also keeps the desktop and mobile
// toggle instances in sync (each used to hold its own separate state).
function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
const getIsLight = () => document.documentElement.classList.contains("light");
const getServerIsLight = () => false; // server markup renders the dark default

export default function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribe, getIsLight, getServerIsLight);

  function toggle() {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("latexci_theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="theme-toggle-btn"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        /* 32px visually, 44px touch target on mobile via padding */
        width: 32,
        height: 32,
        borderRadius: 7,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        cursor: "pointer",
        flexShrink: 0,
        fontSize: "0.95rem",
        lineHeight: 1,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {isLight ? "🌙" : "☀️"}
      <style>{`
        /* Enlarge tap area on touch devices without changing visual size */
        @media (hover: none) and (pointer: coarse) {
          .theme-toggle-btn {
            padding: 6px;
            width: 44px !important;
            height: 44px !important;
          }
        }
      `}</style>
    </button>
  );
}
