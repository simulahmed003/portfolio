"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site";
import { initials } from "@/lib/site";
import Pic from "./Pic";

export default function SiteHeader({
  name,
  logo,
  nav,
  cvUrl,
  labels,
}: {
  name: string;
  logo: string;
  nav: NavItem[];
  cvUrl: string;
  labels: { menu: string; downloadCv: string };
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
          {logo ? (
            <span className="relative h-8 w-8 overflow-hidden rounded-md">
              <Pic src={logo} alt="" fill sizes="32px" className="object-contain" />
            </span>
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-md border border-accent/40 bg-accent-soft font-mono text-[11px] text-accent">{initials(name)}</span>
          )}
          <span>{name}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-text">
              {n.label}
            </Link>
          ))}
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-4 py-1.5 text-text transition hover:border-accent hover:text-accent">
              {labels.downloadCv}
            </a>
          )}
        </nav>
        {(nav.length > 0 || cvUrl) && (
          <button aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-md border border-line md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        )}
      </div>
      {open && (
        <nav className="border-t border-line bg-bg px-5 py-3 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-3 text-muted hover:text-text">
              {n.label}
            </Link>
          ))}
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noreferrer" className="block py-3 text-accent">
              {labels.downloadCv}
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
