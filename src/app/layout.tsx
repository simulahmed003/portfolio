import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { themeVars } from "@/lib/theme";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#07090c", colorScheme: "dark" };

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const share = c.meta.ogImage || c.hero.photo;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: c.meta.siteTitle || c.hero.name, template: `%s | ${c.hero.name}` },
    description: c.meta.description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: c.hero.name, title: c.meta.siteTitle, description: c.meta.description, images: share ? [share] : [] },
    twitter: { card: share ? "summary_large_image" : "summary", title: c.meta.siteTitle, description: c.meta.description, images: share ? [share] : [] },
    icons: c.meta.favicon ? { icon: c.meta.favicon, apple: c.meta.favicon } : undefined,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const c = await getContent();
  return (
    <html lang="en" style={themeVars(c.theme.accent) as React.CSSProperties}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
