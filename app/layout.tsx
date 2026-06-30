import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";
import { getSiteData } from "@/lib/site-data";

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

const FALLBACK_META: Metadata = {
  title: "StudioONE",
  description: "One studio in Hull, booked by the hour. Sutton Village.",
};

export async function generateMetadata(): Promise<Metadata> {
  let meta;
  try {
    meta = (await getSiteData()).content.meta;
  } catch {
    return FALLBACK_META; // e.g. no DB at build time
  }
  return {
    metadataBase: new URL("https://studioone.room"),
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: {
      type: "website",
      siteName: "StudioONE",
      locale: "en_GB",
      url: meta.canonical,
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: [
        {
          url: meta.ogImage,
          width: 1200,
          height: 630,
          alt: meta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.twitterTitle,
      description: meta.twitterDescription,
      images: [meta.ogImage],
    },
    icons: {
      icon: FAVICON,
      apple: APPLE_ICON,
      other: [{ rel: "mask-icon", url: MASK_ICON, color: "#d98324" }],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  let themeColor = "#221a13";
  try {
    themeColor = (await getSiteData()).content.meta.themeColor;
  } catch {
    /* fall back to the umber default */
  }
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor,
  };
}

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
