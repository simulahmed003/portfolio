import type { SiteContent } from "./types";

export type NavItem = { href: string; label: string };

// Menu links come from the section list in admin: a section is in the menu when it is shown and has a menu label.
export function navItems(c: SiteContent): NavItem[] {
  return c.layout.filter((l) => l.show && l.nav.trim()).map((l) => ({ href: `/#${l.id}`, label: l.nav.trim() }));
}

export function headerProps(c: SiteContent) {
  return {
    name: c.hero.name,
    logo: c.meta.logo,
    nav: navItems(c),
    cvUrl: c.contact.cvUrl,
    labels: { menu: c.labels.menu, downloadCv: c.labels.downloadCv },
  };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}
