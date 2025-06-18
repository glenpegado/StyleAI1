import { TempoInit } from "@/components/tempo-init";
import { PromptProvider } from "@/contexts/PromptContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitsio - AI Fashion Assistant",
  description:
    "Discover complete outfit ideas with high-end options and budget-friendly alternatives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className} suppressHydrationWarning>
        <PromptProvider>
          {children}
          <TempoInit />
        </PromptProvider>
      </body>
    </html>
  );
}
