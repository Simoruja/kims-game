import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Asita's Games", template: "%s · Asita's Games" },
  description:
    "Memory and word games for phones, tablets and computers: Asita's Game, Asita's Match and Asita's Word.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/shared/icon.svg", apple: "/shared/icon-180.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c2233",
};

// The home page and both games are static pages in public/ (see next.config.ts).
// Next.js itself only renders the manifest and the 404 page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
