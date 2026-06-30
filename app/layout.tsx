import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";

// Fraunces — variable, with optical sizing + the SOFT/WONK axes the design uses,
// plus italics for the marigold <em> accents. Space Mono for all the micro-labels.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-space-mono",
  display: "swap",
});

// Inline SVG favicon: umber tile, marigold mark — no extra request (from legacy).
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='5' fill='%23221a13'/%3E%3Ccircle cx='16' cy='16' r='4.6' fill='%23d98324'/%3E%3C/svg%3E";
const APPLE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%23221a13'/%3E%3Ccircle cx='90' cy='90' r='26' fill='%23d98324'/%3E%3C/svg%3E";
const MASK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='5' fill='black'/%3E%3C/svg%3E";
const OG_IMAGE =
  "https://images.unsplash.com/photo-1722604819704-78b6d9c26ea9?auto=format&fit=crop&w=1200&h=630&q=80";

export const metadata: Metadata = {
  metadataBase: new URL("https://studioone.room"),
  title: "StudioONE — one studio in Hull, booked by the hour. Sutton Village.",
  description:
    "StudioONE — a bare, daylit studio in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Pay by bank transfer; your door code arrives by email once it clears. For shoots, classes, dinners, workshops and quiet days.",
  alternates: { canonical: "https://studioone.room/" },
  openGraph: {
    type: "website",
    siteName: "StudioONE",
    locale: "en_GB",
    url: "https://studioone.room/",
    title: "StudioONE — a room in Hull, kept by the hour",
    description:
      "A bare, daylit room in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Pay by transfer; the door code lands by email once it clears.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The room — empty, daylit, oak floor, lime-plaster walls.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudioONE — a room in Hull, kept by the hour",
    description:
      "A bare, daylit room in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Code by email once payment clears.",
    images: [OG_IMAGE],
  },
  icons: {
    icon: FAVICON,
    apple: APPLE_ICON,
    other: [{ rel: "mask-icon", url: MASK_ICON, color: "#d98324" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#221a13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
