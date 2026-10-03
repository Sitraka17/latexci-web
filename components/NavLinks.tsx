"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// The one part of the navbar that needs the current URL (active-link state).
// Kept as a small island so the rest of the navbar can be a server component.
const LINKS = [
  { href: "/tools/preview",       label: "Preview" },
  { href: "/tools/diff",          label: "Diff" },
  { href: "/tools/word-to-latex", label: "Word → LaTeX" },
  { href: "/tools/bibtex",        label: "BibTeX" },
  { href: "/tools/symbols",       label: "Symbols" },
  { href: "/tools/table",         label: "Table" },
  { href: "/tools/templates",     label: "Templates" },
  { href: "/academics",           label: "Academics" },
];

function isActive(pathname: string, href: string) {
  // Detail pages (/tools/symbols/argmax, /tools/templates/neurips) highlight their section.
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavLinks({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname() ?? "";
  const ref = useRef<HTMLDivElement>(null);
  const mobile = variant === "mobile";

  // The mobile menu is a native <details>; close it after every navigation.
  useEffect(() => {
    if (mobile) ref.current?.closest("details")?.removeAttribute("open");
  }, [pathname, mobile]);

  const close = mobile ? () => ref.current?.closest("details")?.removeAttribute("open") : undefined;
  const cls = mobile ? "mobile-link" : "nav-link";

  return (
    <div ref={ref} className={mobile ? "mobile-links" : "nav-links"}>
      {LINKS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cls}
          aria-current={isActive(pathname, t.href) ? "page" : undefined}
          onClick={close}
        >
          {t.label}
        </Link>
      ))}
      {mobile && (
        <Link
          href="/pricing"
          className="mobile-link mobile-pricing"
          aria-current={isActive(pathname, "/pricing") ? "page" : undefined}
          onClick={close}
        >
          ✦ Pricing
        </Link>
      )}
    </div>
  );
}
