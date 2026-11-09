import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import VersionExplorer from "@/components/VersionExplorer";
import { Arrow, Tag } from "@/components/ui";
import { getContent, visibleProjects } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const c = await getContent();
  return visibleProjects(c).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const p = c.projects.find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.tagline, openGraph: { images: p.cover ? [p.cover] : [] } } : {};
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const c = await getContent();
  const list = visibleProjects(c);
  const idx = list.findIndex((x) => x.slug === slug);
  if (idx < 0) notFound();
  const p = list[idx];
  const next = list[(idx + 1) % list.length];

  return (
    <>
      <SiteHeader name={c.hero.name} cvUrl={c.contact.cvUrl} />
      <main className="pt-16">
        <section className="bg-grid relative border-b border-line">
          <div className="glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
            <Link href="/#work" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
              <Arrow className="rotate-180" /> All work
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
              <span className="text-accent">{p.category}</span>
              <span>·</span>
              <span>{p.organisation}</span>
              <span>·</span>
              <span>{p.period}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">{p.title}</h1>
            <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted text-pretty">{p.tagline}</p>
            <div className="mt-10 grid gap-10 md:grid-cols-[1.6fr_1fr]">
              <p className="leading-relaxed text-text/85 text-pretty">{p.summary}</p>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted">Role</dt>
                  <dd className="mt-1">{p.role}</dd>
                </div>
                {p.links.length > 0 && (
                  <div>
                    <dt className="text-muted">Links</dt>
                    <dd className="mt-1 flex flex-col gap-1">
                      {p.links.map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {l.label} ↗
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </dl>
            </div>
            {p.metrics.length > 0 && (
              <dl className={`mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line ${["md:grid-cols-1","md:grid-cols-2","md:grid-cols-3","md:grid-cols-4"][Math.min(p.metrics.length, 4) - 1]}`}>
                {p.metrics.map((m, i) => (
                  <div key={i} className="bg-surface p-5">
                    <dt className="text-2xl font-semibold tracking-tight">{m.value}</dt>
                    <dd className="mt-1 text-sm text-muted">{m.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <VersionExplorer versions={p.versions} />
        </section>

        {next && next.slug !== p.slug && (
          <section className="border-t border-line">
            <Link href={`/projects/${next.slug}`} className="group mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-12">
              <div>
                <p className="eyebrow mb-2">Next project</p>
                <p className="text-2xl font-semibold tracking-tight group-hover:text-accent">{next.title}</p>
              </div>
              <Arrow className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
            </Link>
          </section>
        )}
      </main>
      <SiteFooter c={c} />
    </>
  );
}
