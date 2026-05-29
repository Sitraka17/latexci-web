import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0d0d13",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 4,
            background: "linear-gradient(90deg, #7c6cf8, #b49ff5, #7c6cf8)",
          }}
        />

        {/* Code preview card — top right */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 72,
            background: "#141419",
            border: "1px solid #28283a",
            borderRadius: 10,
            padding: "24px 32px",
            fontFamily: "monospace",
            fontSize: 17,
            lineHeight: 1.65,
            maxWidth: 420,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ color: "#569cd6" }}>{"\\documentclass{article}"}</div>
          <div style={{ color: "#569cd6" }}>{"\\usepackage{amsmath}"}</div>
          <div style={{ marginTop: 10, color: "#8a88a4" }}>{"% renders instantly"}</div>
          <div style={{ marginTop: 6, color: "#e4e1ef" }}>{"\\["}</div>
          <div style={{ paddingLeft: 20, color: "#9cdcfe" }}>
            {"  \\int_{-\\infty}^{\\infty} e^{-x^2}dx = \\sqrt{\\pi}"}
          </div>
          <div style={{ color: "#e4e1ef" }}>{"\\]"}</div>
        </div>

        {/* Site URL */}
        <div
          style={{
            fontSize: 18,
            color: "#5a5878",
            fontWeight: 400,
            marginBottom: 16,
            letterSpacing: "0.04em",
          }}
        >
          latexci-web.vercel.app
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            letterSpacing: "-2px",
            color: "#e4e1ef",
            lineHeight: 1.05,
            marginBottom: 20,
          }}
        >
          LaTeX tools
          <br />
          <span style={{ color: "#7c6cf8" }}>for researchers.</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: 24, color: "#8a88a4", maxWidth: 520, lineHeight: 1.5 }}>
          Preview · Diff · Word → LaTeX · Templates
          <br />
          All free, in your browser. No signup.
        </div>

        {/* Pill badges */}
        <div style={{ display: "flex", gap: 10, marginTop: 36 }}>
          {["Free", "No signup", "KaTeX math", "Open source"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                background: "#1c1c26",
                border: "1px solid #28283a",
                color: "#8a88a4",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
