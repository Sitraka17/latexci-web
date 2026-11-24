"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * Counts one `view` per page shown (client navigations included) and, on the
 * first page of a visit, one `land` with the referring site's host when the
 * visitor came from another site. Cookieless: see lib/counter.ts.
 * A reload or a back/forward navigation is not counted as a new arrival.
 */
export default function PageCounter() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    track("view");
    if (!first.current) return;
    first.current = false;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav && nav.type !== "navigate") return;
      if (!document.referrer) return;
      const ref = new URL(document.referrer).hostname;
      if (!ref || ref === window.location.hostname) return;
      track("land", { r: ref });
    } catch {
      // No referrer or an unparsable one: not counted.
    }
  }, [pathname]);

  return null;
}
