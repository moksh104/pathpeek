import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PathPeek - Discover Within Your Budget",
  description: "Find your perfect getaway! Select your mood, set your budget, and discover amazing travel destinations across India. PathPeek helps you explore destinations that match your vibe and wallet.",
  keywords: ["PathPeek", "Travel", "Budget Travel", "India", "Destinations", "Adventure", "Romantic", "Peaceful", "Scenic", "Party", "Vacation", "Holiday"],
  authors: [{ name: "PathPeek Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "PathPeek - Discover Within Your Budget",
    description: "Find your perfect getaway! Select your mood, set your budget, and discover amazing travel destinations across India.",
    url: "https://pathpeek.app",
    siteName: "PathPeek",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PathPeek - Discover Within Your Budget",
    description: "Find your perfect getaway! Select your mood, set your budget, and discover amazing travel destinations across India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
