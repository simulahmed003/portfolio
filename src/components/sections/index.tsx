import Link from "next/link";
import type { SectionId, SiteContent } from "@/lib/types";
import { fill } from "@/lib/text";
import { FeaturedProject, ProjectTile } from "../ProjectCards";
import { AwardCards, CertificateGrid } from "../Certificates";
import { Arrow, Cover, SectionHeading } from "../ui";
import Pic from "../Pic";

type P = { c: SiteContent };

const isExternal = (u: string) => /^https?:\/\//.test(u);

export function Hero({ c }: P) {
  const h = c.hero;
  return (
    <section className="bg-grid relative overflow-hidden border-b border-line pt-16">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className={`relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 md:py-28 ${h.photo ? "md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : ""}`}>
        <div className="reveal">
          {h.eyebrow && <p className="eyebrow mb-5">{h.eyebrow}</p>}
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">{h.name}</h1>
          {h.headline && <p className="mt-6 text-2xl font-medium leading-snug tracking-tight text-balance text-text/90 md:text-3xl">{h.headline}</p>}
          {h.intro && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{h.intro}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            {h.primaryCta.label && (
              <a
                href={h.primaryCta.url || "#"}
                {...(isExternal(h.primaryCta.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition hover:brightness-110"
              >
                {h.primaryCta.label} <Arrow />
              </a>
            )}
            {h.secondaryCta.label && (
              <a
                href={h.secondaryCta.url || "#"}
                {...(isExternal(h.secondaryCta.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium transition hover:border-text"
              >
                {h.secondaryCta.label}
              </a>
            )}
          </div>
          {h.availability && (
            <p className="mt-8 flex items-center gap-2.5 text-sm text-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              {h.availability}
            </p>
          )}
        </div>
        {h.photo && (
          <div className="reveal relative mx-auto w-full max-w-sm [animation-delay:120ms]">
            <div className="absolute -inset-3 rounded-[28px] border border-accent/20" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line-strong bg-surface">
              <Pic src={h.photo} alt={h.name} fill priority sizes="(min-width: 768px) 380px, 90vw" className="object-cover" />
              {h.location && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                  <p className="font-mono text-xs text-white/80">{h.location}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Stats({ c }: P) {
  if (!c.stats.length) return null;
  const n = Math.min(c.stats.length, 4);
  return (
    <section id="stats" className="border-b border-line bg-surface/50">
      <dl className={`mx-auto grid max-w-6xl grid-cols-2 px-5 ${["md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"][n - 1]}`}>
        {c.stats.map((s, i) => (
          <div
            key={i}
            className={`py-8 md:py-10 ${i % 2 ? "pl-5" : "pr-5"} ${i % n > 0 ? "md:border-l md:border-line md:pl-8" : "md:pl-0"} ${i >= 2 ? "border-t border-line" : ""} ${i < n ? "md:border-t-0" : ""}`}
          >
            <dt className="text-3xl font-semibold tracking-tight md:text-4xl">{s.value}</dt>
            <dd className="mt-2 text-sm leading-snug text-muted">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function About({ c }: P) {
  const a = c.about;
  if (!a.heading && !a.paragraphs.length && !a.pillars.length) return null;
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className={`grid grid-cols-1 gap-12 ${a.pillars.length ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""}`}>
        <div>
          {a.eyebrow && <p className="eyebrow mb-3">{a.eyebrow}</p>}
          {a.heading && <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{a.heading}</h2>}
          {a.paragraphs.map((p, i) => (
            <p key={i} className="mt-5 text-lg leading-relaxed text-muted text-pretty">
              {p}
            </p>
          ))}
        </div>
        {a.pillars.length > 0 && (
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {a.pillars.map((p, i) => (
              <div key={i} className="bg-surface p-6">
                <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Work({ c }: P) {
  const s = c.projectsSection;
  const featured = c.projects.filter((p) => p.featured);
  const others = c.projects.filter((p) => !p.featured);
  const shown = s.homeLimit > 0 ? others.slice(0, s.homeLimit) : others;
  if (!c.projects.length) return null;
  return (
    <section id="work" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} intro={s.intro} />
        {featured.length > 0 && (
          <div className="flex flex-col gap-6">
            {featured.map((p, i) => (
              <FeaturedProject key={p.slug} p={p} index={i} labels={c.labels} />
            ))}
          </div>
        )}
        {shown.length > 0 && (
          <>
            <div className={`mb-6 flex items-end justify-between gap-4 ${featured.length ? "mt-16" : ""}`}>
              <h3 className="text-xl font-semibold tracking-tight">{s.moreHeading}</h3>
              {s.allLabel && (
                <Link href="/projects" className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted hover:text-text">
                  {s.allLabel} <Arrow />
                </Link>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => (
                <ProjectTile key={p.slug} p={p} labels={c.labels} />
              ))}
            </div>
          </>
        )}
        {!shown.length && s.allLabel && (
          <Link href="/projects" className="mt-10 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
            {s.allLabel} <Arrow />
          </Link>
        )}
      </div>
    </section>
  );
}

function Experience({ c }: P) {
  const s = c.experienceSection;
  if (!c.experience.length) return null;
  return (
    <section id="experience" className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} intro={s.intro} />
        <ol className="relative border-l border-line">
          {c.experience.map((e, i) => (
            <li key={i} className="relative pb-10 pl-8 last:pb-0 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:pl-10">
              <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${e.current ? "border-accent bg-accent" : "border-line-strong bg-bg"}`} />
              <div className="mb-2 md:mb-0">
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <p className="mt-1 text-xs text-muted/80">{e.type}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {e.role} {e.organisation && <span className="text-muted">· {e.organisation}</span>}
                </h3>
                {e.location && <p className="mt-0.5 text-sm text-muted/80">{e.location}</p>}
                {e.summary && <p className="mt-3 leading-relaxed text-muted text-pretty">{e.summary}</p>}
                {e.bullets.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {e.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Featured certificates first, then the rest, up to the home page limit.
export function homeCertificates(c: SiteContent) {
  const sorted = [...c.certificates.filter((x) => x.featured), ...c.certificates.filter((x) => !x.featured)];
  const lim = c.recognitionSection.homeLimit;
  return lim > 0 ? sorted.slice(0, lim) : sorted;
}

function Recognition({ c }: P) {
  const s = c.recognitionSection;
  if (!c.awards.length && !c.certificates.length) return null;
  const certs = homeCertificates(c);
  return (
    <section id="recognition" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} intro={s.intro} />
        {c.awards.length > 0 && <AwardCards items={c.awards} labels={c.labels} />}
        {certs.length > 0 && (
          <>
            <div className={`mb-6 flex items-end justify-between gap-4 ${c.awards.length ? "mt-16" : ""}`}>
              <h3 className="text-xl font-semibold tracking-tight">{s.certificatesHeading}</h3>
              <Link href="/certificates" className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted hover:text-text">
                {fill(c.labels.viewAllCertificates, { n: c.certificates.length })} <Arrow />
              </Link>
            </div>
            <CertificateGrid items={certs} labels={c.labels} />
          </>
        )}
      </div>
    </section>
  );
}

function Skills({ c }: P) {
  const s = c.skillsSection;
  if (!c.skills.length) return null;
  return (
    <section id="skills" className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} intro={s.intro} />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {c.skills.map((g, i) => (
            <div key={i}>
              <h3 className="border-b border-line pb-2 font-mono text-xs uppercase tracking-wider text-accent">{g.group}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {g.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Leadership({ c }: P) {
  const s = c.activitiesSection;
  if (!c.activities.length && !c.education.length) return null;
  return (
    <section id="leadership" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading eyebrow={s.eyebrow} title={s.heading} intro={s.intro} />
        {c.activities.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.activities.map((a, i) => {
              const body = (
                <>
                  <Cover src={a.image} alt={a.title} label={a.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3]" />
                  <div className="p-5">
                    {a.date && <p className="font-mono text-xs text-muted">{a.date}</p>}
                    <h3 className="mt-1.5 font-semibold tracking-tight">{a.title}</h3>
                    {a.text && <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>}
                  </div>
                </>
              );
              return a.link ? (
                <a key={i} href={a.link} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-line bg-surface transition hover:border-line-strong">
                  {body}
                </a>
              ) : (
                <article key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
                  {body}
                </article>
              );
            })}
          </div>
        )}
        {c.education.length > 0 && (
          <>
            {s.educationHeading && <h3 className={`mb-6 text-xl font-semibold tracking-tight ${c.activities.length ? "mt-16" : ""}`}>{s.educationHeading}</h3>}
            <div className="grid gap-5 md:grid-cols-2">
              {c.education.map((e, i) => (
                <div key={i} className="rounded-xl border border-line p-6">
                  {e.period && <p className="font-mono text-xs text-muted">{e.period}</p>}
                  <h3 className="mt-2 font-semibold">{e.school}</h3>
                  {e.degree && <p className="mt-1 text-sm text-accent">{e.degree}</p>}
                  {e.detail && <p className="mt-3 text-sm text-muted">{e.detail}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Contact({ c }: P) {
  const k = c.contact;
  const links = k.links.filter((l) => l.url);
  return (
    <section id="contact" className="bg-grid relative overflow-hidden border-t border-line">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-32">
        {k.eyebrow && <p className="eyebrow mb-4">{k.eyebrow}</p>}
        {k.heading && <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">{k.heading}</h2>}
        {k.text && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{k.text}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
          {k.email && (
            <a href={`mailto:${k.email}`} className="inline-flex max-w-full items-center gap-2 break-all rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition hover:brightness-110">
              {k.email}
            </a>
          )}
          {links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium hover:border-text">
              {l.label || l.url}
            </a>
          ))}
          {k.cvUrl && (
            <a href={k.cvUrl} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium hover:border-text">
              {c.labels.downloadCv}
            </a>
          )}
        </div>
        {(k.location || k.phone) && <p className="mt-8 text-sm text-muted">{[k.location, k.phone].filter(Boolean).join(" · ")}</p>}
      </div>
    </section>
  );
}

export const SECTIONS: Record<SectionId, (p: P) => React.ReactNode> = {
  stats: Stats,
  about: About,
  work: Work,
  experience: Experience,
  recognition: Recognition,
  skills: Skills,
  leadership: Leadership,
  contact: Contact,
};
