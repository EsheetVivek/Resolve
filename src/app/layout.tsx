import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import "./globals.css";

// Instrument Serif (SIL Open Font License, src/fonts/INSTRUMENT-SERIF-OFL.txt) for headlines.
const serif = localFont({ src: [{ path: "../fonts/serif.woff2", style: "normal" }, { path: "../fonts/serif-italic.woff2", style: "italic" }], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Resolve · AI support replies that can't over-promise", template: "%s · Resolve" },
  description: "Drafts support replies that only say what your policy says, and routes every refund or exception to someone allowed to approve it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
