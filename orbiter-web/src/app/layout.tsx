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
  title: "Orbitr | Digital Overseer",
  description: "Advanced SDLC Compliance & Workflow Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-void text-text-bright min-h-screen selection:bg-status-active selection:text-bg-void`}
      >
        {/* Background Grid Pattern */}
        <div
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {children}
      </body>
    </html>
  );
}
