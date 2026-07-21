import type { Metadata, Viewport } from "next";
import { Archivo, Unbounded, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Prism design system fonts — see docs/ARCHITECTURE.md §18.1. Unbounded
// carries the one hero moment per screen; Archivo is the UI/body workhorse;
// Plex Mono is reserved for real tabular data (cost/wear, dates).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Outfitly — Your AI Wardrobe",
  description: "Digitize your wardrobe, discover better outfits, and get dressed with confidence.",
};

// Locked viewport + safe-area cover so bottom-nav insets (env(safe-area-inset-bottom))
// work correctly on notched devices — see docs/ARCHITECTURE.md §19.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${unbounded.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
