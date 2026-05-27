"use client";
/**
 * AdUnit — pluggable ad slot.
 *
 * To activate:
 *  1. Carbon Ads  (recommended for dev/academic audiences, ~$1-5 CPM)
 *     → Apply at https://www.buysellads.com/
 *     → Set PROVIDER = "carbon" and paste your serve ID into CARBON_SERVE_ID
 *
 *  2. EthicalAds  (privacy-respecting, good for open source)
 *     → Apply at https://ethicalads.io/
 *     → Set PROVIDER = "ethical" and paste your publisher ID into ETHICAL_PUBLISHER
 *
 *  3. Google AdSense  (broadest reach, lower CPM for niche audiences)
 *     → https://adsense.google.com/  — add AdSense script to layout.tsx head
 *     → Set PROVIDER = "adsense" and paste your ad-slot ID into ADSENSE_SLOT
 *
 *  Leave PROVIDER = "none" to show nothing (default until approved).
 */

import { useEffect, useRef } from "react";

type Provider = "carbon" | "ethical" | "adsense" | "none";

// ── Configure here ──────────────────────────────────────────
const PROVIDER: Provider = "none";
const CARBON_SERVE_ID   = "CEAIC423"; // replace with your Carbon serve ID
const ETHICAL_PUBLISHER = "latexci";  // replace with your EthicalAds publisher slug
const ADSENSE_SLOT      = "";         // replace with your AdSense slot ID
// ────────────────────────────────────────────────────────────

const WRAPPER: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "0.5rem 0",
};

export default function AdUnit() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Carbon Ads — inject script once on mount
  useEffect(() => {
    if (PROVIDER !== "carbon" || !containerRef.current) return;
    if (document.getElementById("_carbonads_js")) return; // already injected
    const s = document.createElement("script");
    s.id = "_carbonads_js";
    s.async = true;
    s.src = `//cdn.carbonads.com/carbon.js?serve=${CARBON_SERVE_ID}&placement=latexciwebapp`;
    containerRef.current.appendChild(s);
  }, []);

  // EthicalAds — load their client script once
  useEffect(() => {
    if (PROVIDER !== "ethical") return;
    if (document.getElementById("_ethicalads_js")) return;
    const s = document.createElement("script");
    s.id = "_ethicalads_js";
    s.async = true;
    s.src = "https://media.ethicalads.io/media/client/ethicalads.min.js";
    document.head.appendChild(s);
  }, []);

  if (PROVIDER === "none") return null;

  if (PROVIDER === "carbon") {
    return (
      <div style={WRAPPER}>
        <div ref={containerRef} id="carbonads" />
      </div>
    );
  }

  if (PROVIDER === "ethical") {
    return (
      <div style={WRAPPER}>
        <div
          data-ea-publisher={ETHICAL_PUBLISHER}
          data-ea-type="image"
          style={{ maxWidth: 400 }}
        />
      </div>
    );
  }

  if (PROVIDER === "adsense") {
    return (
      <div style={WRAPPER}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", minWidth: 280, maxWidth: 640 }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // replace with your publisher ID
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return null;
}
