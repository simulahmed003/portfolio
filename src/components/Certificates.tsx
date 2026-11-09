"use client";
import { useMemo, useState } from "react";
import type { Award, Certificate, Labels } from "@/lib/types";
import Lightbox, { type LightboxItem } from "./Lightbox";
import Pic from "./Pic";

type L = Pick<Labels, "close" | "previous" | "next" | "verify" | "openPdf" | "credentialId" | "viewCertificate" | "filterAll">;

function certItem(c: Certificate, labels: L): LightboxItem {
  const details = [
    c.issuer && { label: "", value: c.issuer },
    c.date && { label: "", value: c.date },
    c.credentialId && { label: labels.credentialId, value: c.credentialId },
  ].filter(Boolean) as { label: string; value: string }[];
  const links = [c.credentialUrl && { label: labels.verify, url: c.credentialUrl }, c.file && { label: labels.openPdf, url: c.file }].filter(Boolean) as {
    label: string;
    url: string;
  }[];
  return { src: c.image, alt: c.title, title: c.title, caption: c.detail, details: details.map((d) => ({ ...d, label: d.label || " " })), links };
}

function Seal() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="text-accent">
      <circle cx="24" cy="20" r="11" />
      <path d="M18 29l-3 13 9-5 9 5-3-13" />
      <path d="M19.5 20l3 3 6-6" />
    </svg>
  );
}

function CertificateCard({ c, onOpen, labels }: { c: Certificate; onOpen?: () => void; labels: L }) {
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.07),transparent_70%)]">
        {c.image ? (
          <Pic src={c.image} alt={c.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-4 transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center">
            <Seal />
          </div>
        )}
        {c.kind && (
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/85 backdrop-blur">
            {c.kind}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 text-left">
        <h3 className="font-semibold leading-snug tracking-tight">{c.title}</h3>
        <p className="mt-1.5 text-sm text-accent">{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
        {c.detail && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{c.detail}</p>}
        {c.image && <span className="mt-auto pt-4 text-xs font-medium text-muted transition group-hover:text-text">{labels.viewCertificate} →</span>}
      </div>
    </>
  );
  const cls = "group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-line-strong";
  return c.image && onOpen ? (
    <button type="button" onClick={onOpen} className={cls}>
      {body}
    </button>
  ) : (
    <article className={cls}>{body}</article>
  );
}

export function CertificateGrid({ items, labels }: { items: Certificate[]; labels: L }) {
  const [open, setOpen] = useState<number | null>(null);
  const viewable = items.filter((c) => c.image);
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <CertificateCard key={c.title + i} c={c} labels={labels} onOpen={() => setOpen(viewable.indexOf(c))} />
        ))}
      </div>
      {open !== null && open >= 0 && (
        <Lightbox items={viewable.map((c) => certItem(c, labels))} index={open} onClose={() => setOpen(null)} onIndex={setOpen} labels={labels} />
      )}
    </>
  );
}

export function AwardCards({ items, labels }: { items: Award[]; labels: L }) {
  const [open, setOpen] = useState<number | null>(null);
  const viewable = items.filter((a) => a.image);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((a, i) => (
          <article key={a.title + i} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
            {a.image && (
              <button type="button" onClick={() => setOpen(viewable.indexOf(a))} className="relative block aspect-[16/10] overflow-hidden bg-surface-2" aria-label={a.title}>
                <Pic src={a.image} alt={a.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
              </button>
            )}
            <div className="flex flex-1 flex-col p-6">
              {a.date && <p className="font-mono text-xs text-muted">{a.date}</p>}
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{a.title}</h3>
              {a.organisation && <p className="mt-1 text-sm text-accent">{a.organisation}</p>}
              {a.detail && <p className="mt-3 text-sm leading-relaxed text-muted">{a.detail}</p>}
              {a.link && (
                <a href={a.link} target="_blank" rel="noreferrer" className="mt-auto pt-4 text-sm text-muted hover:text-text">
                  {a.link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]} ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {open !== null && open >= 0 && (
        <Lightbox
          items={viewable.map((a) => ({ src: a.image, alt: a.title, title: a.title, caption: a.detail, details: [a.organisation, a.date].filter(Boolean).map((v) => ({ label: " ", value: v })) }))}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
          labels={labels}
        />
      )}
    </>
  );
}

// Certificates page: filter by type.
export function CertificateBrowser({ items, labels }: { items: Certificate[]; labels: L }) {
  const kinds = useMemo(() => Array.from(new Set(items.map((c) => c.kind).filter(Boolean))), [items]);
  const [kind, setKind] = useState("");
  const list = kind ? items.filter((c) => c.kind === kind) : items;
  return (
    <div>
      {kinds.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group">
          {["", ...kinds].map((k) => {
            const count = k ? items.filter((c) => c.kind === k).length : items.length;
            return (
              <button
                key={k || "all"}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${kind === k ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-line-strong hover:text-text"}`}
              >
                {k || labels.filterAll} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <CertificateGrid key={kind} items={list} labels={labels} />
    </div>
  );
}
