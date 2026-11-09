import Link from "next/link";
import type { ProjectFamily } from "@/lib/types";
import { Arrow, Cover, Tag } from "./ui";

function VersionRail({ p }: { p: ProjectFamily }) {
  if (p.versions.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
      {p.versions.map((v, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className={`rounded border px-1.5 py-0.5 ${i === p.versions.length - 1 ? "border-accent/50 text-accent" : "border-line text-muted"}`}>{v.label}</span>
          {i < p.versions.length - 1 && <span className="text-line-strong">→</span>}
        </span>
      ))}
    </div>
  );
}

export function FeaturedProject({ p, index }: { p: ProjectFamily; index: number }) {
  const flip = index % 2 === 1;
  return (
    <Link
      href={`/projects/${p.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-line-strong md:grid-cols-2"
    >
      <Cover
        src={p.cover}
        alt={p.title}
        label={p.organisation}
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`aspect-[4/3] md:aspect-auto md:min-h-[380px] ${flip ? "md:order-2" : ""}`}
      />
      <div className="flex flex-col gap-5 p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
          <span className="text-accent">{p.category}</span>
          <span>·</span>
          <span>{p.organisation}</span>
          <span>·</span>
          <span>{p.period}</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-balance md:text-[1.7rem]">{p.title}</h3>
        <p className="leading-relaxed text-muted text-pretty">{p.tagline}</p>
        {p.metrics.length > 0 && (
          <dl className="grid grid-cols-3 gap-4 border-y border-line py-4">
            {p.metrics.slice(0, 3).map((m, i) => (
              <div key={i}>
                <dt className="text-xl font-semibold tracking-tight">{m.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{m.label}</dd>
              </div>
            ))}
          </dl>
        )}
        <VersionRail p={p} />
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-text">
          {p.versions.length > 1 ? `Explore ${p.versions.length} versions` : "View project"}
          <Arrow className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function ProjectTile({ p }: { p: ProjectFamily }) {
  return (
    <Link href={`/projects/${p.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-line-strong">
      <Cover src={p.cover} alt={p.title} label={p.organisation} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted">
          <span className="text-accent">{p.category}</span>
          <span>{p.period}</span>
        </div>
        <h3 className="font-semibold tracking-tight text-balance">{p.title}</h3>
        <p className="text-sm leading-relaxed text-muted text-pretty">{p.tagline}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {p.versions.length > 1 && <Tag>{p.versions.length} versions</Tag>}
          {p.tags.slice(0, 2).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}
