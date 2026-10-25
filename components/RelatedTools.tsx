import { Fragment } from "react";
import Link from "@/components/Link";

/**
 * "See also" line linking sibling tools, set like a LaTeX remark rather than
 * a row of pills. Server component: no client JS.
 */

export type RelatedTool = { label: string; href: string };

export default function RelatedTools({ tools, heading = "See also." }: { tools: RelatedTool[]; heading?: string }) {
  if (tools.length === 0) return null;
  return (
    <nav aria-label="Related tools" className="remark" style={{ marginTop: "2.25rem" }}>
      <b>{heading}</b>{" "}
      {tools.map(({ label, href }, i) => (
        <Fragment key={href}>
          {i > 0 && (i === tools.length - 1 ? " and " : ", ")}
          <Link href={href}>{label}</Link>
        </Fragment>
      ))}
      .
    </nav>
  );
}
