import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartQuote.ai — Enterprise AI Quotation Generator",
  description:
    "SmartQuote.ai is an enterprise-grade AI-powered multi-agent system that analyzes customer requirements, detects SKUs, applies pricing logic, and generates professional quotations instantly with PDF export.",
  keywords: [
    "AI quotation generator",
    "SmartQuote.ai",
    "quotation software",
    "multi-agent AI",
    "enterprise pricing engine",
    "SKU detection",
    "FastAPI",
    "Next.js",
    "WeasyPrint PDF",
    "automated quotation system",
  ],
  authors: [{ name: "Zaki Noorani" }],
  openGraph: {
    title: "SmartQuote.ai — Enterprise AI Quotation Generator",
    description:
      "Generate professional quotations instantly using AI-driven multi-agent intelligence. Supports SKU detection, pricing, review, and PDF export.",
    url: "https://smart-quotation-generator.vercel.app/",
    siteName: "SmartQuote.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartQuote.ai — AI Powered Quotation Generator",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
