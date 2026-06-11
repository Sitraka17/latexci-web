import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 512, height: 512 };

// PWA / general-purpose app icon — referenced by public/manifest.json at /icon.
export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 300,
            fontWeight: 800,
            letterSpacing: "-12px",
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
