import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import VersionExplorer from "@/components/VersionExplorer";
import CopyLink from "@/components/CopyLink";
import { Arrow, GithubIcon, Tag } from "@/components/ui";
import { parseRepo } from "@/lib/schema";
import { getContent } from "@/lib/content";
import { headerProps } from "@/lib/site";
import { projectImages } from "@/lib/projectImages";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const c = await getContent();
  return c.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const p = c.projects.find((x) => x.slug === slug);
  if (!p) return {};
  const img = projectImages(p, 1)[0]?.src;
  return {
    title: p.title,
    description: p.tagline || p.summary.slice(0, 160),
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.title, description: p.tagline, images: img ? [img] : [] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const c = await getContent();
  const list = c.projects;
  const idx = list.findIndex((x) => x.slug === slug);
  if (idx < 0) {
    // an earlier address of a renamed project: send visitors (and old CV links) to the current one
    const moved = list.find((x) => x.oldSlugs.includes(slug));
    if (moved) permanentRedirect(`/projects/${moved.slug}`);
    notFound();
  }
  const p = list[idx];
  const next = list[(idx + 1) % list.length];
  const L = c.labels;
  const meta = [p.organisation, p.period].filter(Boolean);
  const repos = p.repos.filter((r) => r.url);

  return (
    <>
      <SiteHeader {...headerProps(c)} />
      <main className="pt-16">
        <section className="bg-grid relative border-b border-line">
          <div className="glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
            <div className="flex items-center justify-between gap-4">
              <Link href="/#work" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
                <Arrow className="rotate-180" /> {L.allWork}
              </Link>
              <CopyLink path={`/projects/${p.slug}`} label={L.copyLink} done={L.linkCopied} />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
              {p.category && <span className="text-accent">{p.category}</span>}
              {meta.map((m, i) => (
                <span key={i} className="flex items-center gap-3">
                  {(p.category || i > 0) && <span aria-hidden>·</span>}
                  <span>{m}</span>
                </span>
              ))}
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">{p.title}</h1>
            {p.tagline && <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted text-pretty">{p.tagline}</p>}
            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <p className="whitespace-pre-line leading-relaxed text-text/85 text-pretty">{p.summary}</p>
              <dl className="min-w-0 space-y-4 text-sm">
                {p.role && (
                  <div>
                    <dt className="text-muted">{L.role}</dt>
                    <dd className="mt-1">{p.role}</dd>
                  </div>
                )}
                {repos.length > 0 && (
                  <div>
                    <dt className="text-muted">{L.sourceCode}</dt>
                    <dd className="mt-2 flex flex-col gap-2">
                      {repos.map((r) => {
                        const id = parseRepo(r.url);
                        return (
                          <a
                            key={r.url}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-start gap-3 rounded-lg border border-line bg-surface/60 px-3 py-2.5 transition hover:border-accent/60"
                          >
                            <GithubIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-hover:text-accent" />
                            <span className="min-w-0">
                              <span className="block font-medium leading-snug break-words group-hover:text-accent">{r.name || id?.repo || r.url}</span>
                              {r.note && <span className="mt-0.5 block text-xs leading-snug text-muted">{r.note}</span>}
                              {id && <span className="mt-1 block truncate font-mono text-[11px] text-muted/70">github.com/{id.owner}/{id.repo}</span>}
                            </span>
                          </a>
                        );
                      })}
                    </dd>
                  </div>
                )}
                {p.links.some((l) => l.url) && (
                  <div>
                    <dt className="text-muted">{L.links}</dt>
                    <dd className="mt-1 flex flex-col gap-1">
                      {p.links
                        .filter((l) => l.url)
                        .map((l) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            {l.label || l.url} ↗
                          </a>
                        ))}
                    </dd>
                  </div>
                )}
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </dl>
            </div>
            {p.metrics.length > 0 && (
              <dl className={`mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line ${["md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"][Math.min(p.metrics.length, 4) - 1]}`}>
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

        {p.versions.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
            <VersionExplorer versions={p.versions} labels={L} />
          </section>
        )}

        {next && next.slug !== p.slug && (
          <section className="border-t border-line">
            <Link href={`/projects/${next.slug}`} className="group mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-12">
              <div>
                <p className="eyebrow mb-2">{L.nextProject}</p>
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
