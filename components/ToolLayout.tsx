import type { ReactNode } from "react";
import Navbar from "./Navbar";

/**
 * Shared shell for all full-screen tool pages (Preview, Diff, Word→LaTeX, Table).
 * Provides 100dvh layout (dynamic viewport height — works correctly on iOS Safari)
 * with sticky Navbar and a flex-fill content area.
 */
export default function ToolLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        /* 100dvh shrinks as the iOS address bar hides, so content
           never gets clipped behind the browser chrome. */
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Navbar />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
