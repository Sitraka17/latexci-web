import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "latexci — LaTeX tools for developers",
  description: "Free browser-based LaTeX tools: preview, diff, Word to LaTeX, and more. No install needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
