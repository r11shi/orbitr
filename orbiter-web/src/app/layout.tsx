import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbiter | Agent Swarm Orchestration",
  description: "Real-time monitoring and control of autonomous agent swarms with advanced security and compliance features",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230a0e27' width='192' height='192'/><circle cx='96' cy='96' r='60' fill='%2300d9ff' opacity='0.8'/></svg>",
        href: "/favicon.ico",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230a0e27' width='192' height='192'/><circle cx='96' cy='96' r='60' fill='%2300d9ff' opacity='0.8'/></svg>",
        href: "/favicon.ico",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e27" },
  ],
  userScalable: false,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-void text-text-primary min-h-screen selection:bg-accent-primary selection:text-bg-void`}
      >
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
