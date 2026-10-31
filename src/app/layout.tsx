import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteDefaults } from "@/config/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteDefaults.websiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteDefaults.seo.title} | ${siteDefaults.name}`, template: `%s | ${siteDefaults.name}` },
  description: siteDefaults.seo.description,
  openGraph: {
    type: "website",
    siteName: siteDefaults.name,
    title: siteDefaults.seo.title,
    description: siteDefaults.seo.description,
    url: siteUrl,
    images: [{ url: "/images/hero.jpg", width: 1200, height: 675, alt: "Abstract revenue cycle workflow illustration" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#091120" },
  ],
};

/**
 * Boot script: applies the persisted theme + accessibility preferences
 * before first paint so visitors never see a flash of the wrong theme.
 * Order: explicit user choice > OS preference > light default.
 */
const bootScript = `(function(){try{
var d=document.documentElement;
var theme=localStorage.getItem('ymbc-theme');
if(!theme){theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
if(theme==='dark'){d.classList.add('dark');}
var p=JSON.parse(localStorage.getItem('ymbc-a11y')||'{}');
var cls={'contrast':'a11y-contrast','grayscale':'a11y-grayscale','underlineLinks':'a11y-underline-links','highlightLinks':'a11y-highlight-links','enhancedFocus':'a11y-focus','readableFont':'a11y-readable','reduceMotion':'a11y-reduce-motion'};
for(var k in cls){if(p[k]){d.classList.add(cls[k]);}}
if(p.textScale&&p.textScale>=80&&p.textScale<=160){d.style.fontSize=p.textScale+'%';}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
