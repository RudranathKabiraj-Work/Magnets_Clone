import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "../public/fonts/Geist-Variable.ttf",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../public/fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

const SITE = "https://leadmagnets.so";

export const metadata: Metadata = {
  title: {
    default: "Lead Magnet Builder for Landing Pages and Email Capture",
    template: "%s. LeadMagnets",
  },
  description:
    "Create lead magnet landing pages, capture emails, deliver resources instantly, and follow up automatically. Publish on LeadMagnets or your own domain.",
  applicationName: "LeadMagnets",
  authors: [{ name: "LeadMagnets", url: SITE }],
  creator: "LeadMagnets",
  publisher: "LeadMagnets",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  formatDetection: { telephone: false, address: false, email: false },
  manifest: "/manifest.json",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "LeadMagnets",
    locale: "en_US",
    url: SITE,
    title: "LeadMagnets | Lead Magnet Builder",
    description:
      "Create a lead magnet page, capture emails, deliver the resource, and follow up from one place.",
    images: [{ url: "/landing-dashboard.png", width: 1280, height: 720, alt: "LeadMagnets lead magnet builder dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadMagnets | Lead Magnet Builder",
    description:
      "Create a lead magnet page, capture emails, deliver the resource, and follow up from one place.",
    images: ["/landing-dashboard.png"],
  },
  icons: {
    icon: "/brand/magnets-mark-dark.png",
    apple: "/brand/magnets-mark-dark.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
  ],
  colorScheme: "light dark",
};

const themeScript = `
  try {
    var saved = localStorage.getItem('leadmagnets-theme');
    var theme = saved === 'light' || saved === 'dark'
      ? saved
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

import SmoothScroll from "@/components/smooth-scroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-sans">
        <SmoothScroll />
        <div className="contents app-theme">{children}</div>
      </body>
    </html>
  );
}