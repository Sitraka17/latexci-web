import type { Metadata } from "next";
import NotFoundBody from "@/components/NotFoundBody";

export const metadata: Metadata = {
  title: { absolute: "Page not found | latexci" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundBody />;
}
