import type { Metadata } from "next";
import "./globals.css";

// Phase 0 keeps metadata minimal. Phase 1 wires Fraunces + Space Mono via
// next/font and ports the full <head> from legacy/studioone.html.
export const metadata: Metadata = {
  title: "StudioONE",
  description: "One studio in Hull, booked by the hour. Sutton Village.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
