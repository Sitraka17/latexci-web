import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 180, height: 180 };

// iOS home-screen icon — Next auto-injects <link rel="apple-touch-icon">.
// Solid background (no rounded corners): iOS applies its own mask.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0d13 0%, #16121f 100%)",
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: "-4px",
            background: "linear-gradient(135deg, #7c6cf8, #b49ff5)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          ∫x
        </div>
      </div>
    ),
    size
  );
}
