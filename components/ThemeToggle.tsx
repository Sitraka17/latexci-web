"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  // Sync with whatever the anti-flash script already applied
  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("latexci_theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("latexci_theme", "dark");
    }
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
