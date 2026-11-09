import type { SiteContent } from "@/lib/types";
import { fill } from "@/lib/text";

export default function SiteFooter({ c }: { c: SiteContent }) {
  const text = fill(c.footer.text, { year: new Date().getFullYear(), name: c.hero.name });
  const links = c.footer.showLinks ? c.contact.links.filter((l) => l.url) : [];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>{text}</p>
        {(links.length > 0 || (c.footer.showLinks && c.contact.email)) && (
          <div className="flex flex-wrap gap-5">
            {links.map((l) => (
              <a key={l.url} className="hover:text-text" href={l.url} target="_blank" rel="noreferrer">
                {l.label || l.url}
              </a>
            ))}
            {c.contact.email && (
              <a className="hover:text-text" href={`mailto:${c.contact.email}`}>
                {c.contact.email}
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
