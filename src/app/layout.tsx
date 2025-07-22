import { TempoInit } from "@/components/tempo-init";
import { PromptProvider } from "@/contexts/PromptContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "peacedrobe - AI-Powered Fashion Assistant",
  description:
    "Discover celebrity styles and get personalized outfit recommendations with affordable alternatives. Your Gen-Z fashion assistant powered by AI.",
  keywords:
    "fashion, AI, styling, outfits, celebrity style, affordable fashion, streetwear, Gen-Z",
  authors: [{ name: "peacedrobe" }],
  creator: "peacedrobe",
  publisher: "peacedrobe",
  robots: "index, follow",
  openGraph: {
    title: "peacedrobe - AI-Powered Fashion Assistant",
    description:
      "Discover celebrity styles and get personalized outfit recommendations with affordable alternatives.",
    url: "https://peacedrobe.ai",
    siteName: "peacedrobe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "peacedrobe - AI-Powered Fashion Assistant",
    description:
      "Discover celebrity styles and get personalized outfit recommendations with affordable alternatives.",
    creator: "@peacedrobe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempo.build/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className} suppressHydrationWarning>
        <PromptProvider>
          {children}
          <TempoInit />
        </PromptProvider>
      </body>
    </html>
  );
}
