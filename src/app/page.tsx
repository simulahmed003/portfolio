import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FeaturedProject, ProjectTile } from "@/components/ProjectCards";
import { Arrow, Cover, SectionHeading } from "@/components/ui";
import { getContent, visibleProjects } from "@/lib/content";

export default async function Home() {
  const c = await getContent();
  const projects = visibleProjects(c);
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const experience = c.experience.filter((e) => !e.hidden);

  return (
    <>
      <SiteHeader name={c.hero.name} cvUrl={c.contact.cvUrl} />
      <main>
        {/* HERO */}
        <section className="bg-grid relative overflow-hidden border-b border-line pt-16">
          <div className="glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.35fr_1fr] md:py-28">
            <div className="reveal">
              <p className="eyebrow mb-5">{c.hero.eyebrow}</p>
              <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">{c.hero.name}</h1>
              <p className="mt-6 text-2xl font-medium leading-snug tracking-tight text-balance text-text/90 md:text-3xl">{c.hero.headline}</p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{c.hero.intro}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href={c.hero.primaryCta.url} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#14100b] transition hover:brightness-110">
                  {c.hero.primaryCta.label} <Arrow />
                </a>
                <a href={c.hero.secondaryCta.url} className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium transition hover:border-text">
                  {c.hero.secondaryCta.label}
                </a>
              </div>
              {c.hero.availability && (
                <p className="mt-8 flex items-center gap-2.5 text-sm text-muted">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
                  </span>
                  {c.hero.availability}
                </p>
              )}
            </div>
            <div className="reveal relative mx-auto w-full max-w-sm [animation-delay:120ms]">
              <div className="absolute -inset-3 rounded-[28px] border border-accent/20" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line-strong bg-surface">
                {c.hero.photo && <Image src={c.hero.photo} alt={c.hero.name} fill priority sizes="(min-width: 768px) 380px, 90vw" className="object-cover" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                  <p className="font-mono text-xs text-white/80">{c.hero.location}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-b border-line bg-surface/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 px-5 md:grid-cols-4">
            {c.stats.map((s, i) => (
              <div key={i} className={`py-8 md:py-10 ${i % 2 ? "pl-5 md:pl-8" : "pr-5 md:pr-8"} ${i > 0 ? "md:border-l md:border-line md:pl-8" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""}`}>
                <dt className="text-3xl font-semibold tracking-tight md:text-4xl">{s.value}</dt>
                <dd className="mt-2 text-sm leading-snug text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ABOUT */}
        <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="eyebrow mb-3">About</p>
              <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{c.about.heading}</h2>
              {c.about.paragraphs.map((p, i) => (
                <p key={i} className="mt-5 text-lg leading-relaxed text-muted text-pretty">{p}</p>
              ))}
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {c.about.pillars.map((p, i) => (
                <div key={i} className="bg-surface p-6">
                  <p className="font-mono text-xs text-accent">0{i + 1}</p>
                  <h3 className="mt-3 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <SectionHeading eyebrow="Projects" title={c.projectsSection.heading} intro={c.projectsSection.intro} />
            <div className="flex flex-col gap-6">
              {featured.map((p, i) => (
                <FeaturedProject key={p.slug} p={p} index={i} />
              ))}
            </div>
            {others.length > 0 && (
              <>
                <div className="mb-6 mt-16 flex items-end justify-between">
                  <h3 className="text-xl font-semibold tracking-tight">More projects</h3>
                  <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
                    All projects <Arrow />
                  </Link>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((p) => (
                    <ProjectTile key={p.slug} p={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <SectionHeading eyebrow="Career" title={c.experienceSection.heading} intro={c.experienceSection.intro} />
            <ol className="relative border-l border-line">
              {experience.map((e, i) => (
                <li key={i} className="relative pb-10 pl-8 last:pb-0 md:grid md:grid-cols-[220px_1fr] md:gap-8 md:pl-10">
                  <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${e.period.includes("Present") ? "border-accent bg-accent" : "border-line-strong bg-bg"}`} />
                  <div className="mb-2 md:mb-0">
                    <p className="font-mono text-xs text-muted">{e.period}</p>
                    <p className="mt-1 text-xs text-muted/80">{e.type}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {e.role} <span className="text-muted">· {e.organisation}</span>
                    </h3>
                    <p className="mt-0.5 text-sm text-muted/80">{e.location}</p>
                    <p className="mt-3 leading-relaxed text-muted text-pretty">{e.summary}</p>
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

        {/* RECOGNITION */}
        <section id="recognition" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <SectionHeading eyebrow="Recognition" title="Awards and certifications" />
            <div className="grid gap-5 md:grid-cols-3">
              {c.awards.map((a, i) => (
                <article key={i} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
                  {a.image && <Cover src={a.image} alt={a.title} label={a.organisation} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[16/10]" />}
                  <div className="p-6">
                    <p className="font-mono text-xs text-muted">{a.date}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{a.title}</h3>
                    <p className="mt-1 text-sm text-accent">{a.organisation}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{a.detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {c.certifications.map((cert, i) => (
                <div key={i} className="flex items-start gap-4 bg-surface p-5">
                  {cert.image ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                      <Image src={cert.image} alt="" fill sizes="48px" className="object-contain" />
                    </div>
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-line font-mono text-xs text-accent">✓</div>
                  )}
                  <div>
                    <p className="font-medium leading-snug">{cert.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {cert.issuer} · {cert.date}
                    </p>
                    {cert.credential && <p className="mt-1 font-mono text-xs text-muted/80">ID {cert.credential}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <SectionHeading eyebrow="Toolkit" title="Skills and tools" />
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {c.skills.map((s, i) => (
                <div key={i}>
                  <h3 className="border-b border-line pb-2 font-mono text-xs uppercase tracking-wider text-accent">{s.group}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADERSHIP */}
        <section id="leadership" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <SectionHeading eyebrow="Community" title={c.activitiesSection.heading} intro={c.activitiesSection.intro} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.activities.map((a, i) => {
                const body = (
                  <>
                    <Cover src={a.image} alt={a.title} label={a.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3]" />
                    <div className="p-5">
                      <p className="font-mono text-xs text-muted">{a.date}</p>
                      <h3 className="mt-1.5 font-semibold tracking-tight">{a.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
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
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {c.education.map((e, i) => (
                <div key={i} className="rounded-xl border border-line p-6">
                  <p className="font-mono text-xs text-muted">{e.period}</p>
                  <h3 className="mt-2 font-semibold">{e.school}</h3>
                  <p className="mt-1 text-sm text-accent">{e.degree}</p>
                  {e.detail && <p className="mt-3 text-sm text-muted">{e.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="bg-grid relative overflow-hidden border-t border-line">
          <div className="glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-32">
            <p className="eyebrow mb-4">Contact</p>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">{c.contact.heading}</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{c.contact.text}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              {c.contact.email && (
                <a href={`mailto:${c.contact.email}`} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#14100b] transition hover:brightness-110">
                  {c.contact.email}
                </a>
              )}
              {c.contact.linkedin && (
                <a href={c.contact.linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium hover:border-text">
                  LinkedIn
                </a>
              )}
              {c.contact.github && (
                <a href={c.contact.github} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium hover:border-text">
                  GitHub
                </a>
              )}
              {c.contact.cvUrl && (
                <a href={c.contact.cvUrl} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium hover:border-text">
                  Download CV
                </a>
              )}
            </div>
            <p className="mt-8 text-sm text-muted">
              {c.contact.location}
              {c.contact.phone && <> · {c.contact.phone}</>}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter c={c} />
    </>
  );
}
