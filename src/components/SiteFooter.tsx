import type { SiteContent } from "@/lib/types";

export default function SiteFooter({ c }: { c: SiteContent }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {c.hero.name}. Designed and built in Khulna.</p>
        <div className="flex gap-5">
          {c.contact.linkedin && <a className="hover:text-text" href={c.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
          {c.contact.github && <a className="hover:text-text" href={c.contact.github} target="_blank" rel="noreferrer">GitHub</a>}
          {c.contact.email && <a className="hover:text-text" href={`mailto:${c.contact.email}`}>Email</a>}
        </div>
      </div>
    </footer>
  );
}
