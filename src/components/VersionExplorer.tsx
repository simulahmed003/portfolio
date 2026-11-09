"use client";
import { useCallback, useEffect, useState } from "react";
import type { Img, Labels, Version } from "@/lib/types";
import Lightbox from "./Lightbox";
import Pic from "./Pic";

type GalleryLabels = Pick<Labels, "close" | "previous" | "next">;

export function Gallery({ images, labels }: { images: Img[]; labels: GalleryLabels }) {
  const [cur, setCur] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const n = images.length;
  const close = useCallback(() => setOpen(null), []);
  const go = (d: number) => setCur((c) => (c + d + n) % n);

  // auto-advance; stops while hovered, while the viewer is open, or for reduced motion
  useEffect(() => {
    if (n < 2 || paused || open !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setCur((c) => (c + 1) % n), 4500);
    return () => clearInterval(t);
  }, [n, paused, open]);

  if (!n) return null;
  const im = images[Math.min(cur, n - 1)];
  // only the current photo and its neighbours are mounted, so long galleries stay light
  const near = (j: number) => j === cur || j === (cur + 1) % n || j === (cur - 1 + n) % n;
  return (
    <>
      <div className="grid gap-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-surface-2">
          {images.map((x, j) =>
            near(j) ? (
              <Pic
                key={x.src + j}
                src={x.src}
                alt={x.alt || x.caption}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority={j === 0}
                className={`object-cover transition-[opacity,transform] duration-[1000ms] ease-out ${j === cur ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
              />
            ) : null,
          )}
          <button onClick={() => setOpen(cur)} aria-label={im.caption || im.alt || "Open photo"} className="absolute inset-0 cursor-zoom-in" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
            <span className="text-sm text-white/90">{im.caption}</span>
            {n > 1 && <span className="shrink-0 font-mono text-xs text-white/70">{cur + 1} / {n}</span>}
          </div>
          {n > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label={labels.previous} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button onClick={() => go(1)} aria-label={labels.next} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10">
                <div key={`${cur}-${paused}`} className={`h-full bg-accent ${paused ? "w-0" : "progress"}`} />
              </div>
            </>
          )}
        </div>
        {n > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((x, j) => (
              <button
                key={x.src + j}
                onClick={() => setCur(j)}
                title={x.caption}
                aria-label={`${j + 1} / ${n}`}
                aria-current={j === cur}
                className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md border transition sm:w-24 ${j === cur ? "border-accent opacity-100" : "border-line opacity-55 hover:opacity-90"}`}
              >
                <Pic src={x.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open !== null && (
        <Lightbox
          items={images.map((x) => ({ src: x.src, alt: x.alt || x.caption, caption: x.caption }))}
          index={open}
          onClose={close}
          onIndex={setOpen}
          labels={labels}
        />
      )}
    </>
  );
}

export default function VersionExplorer({ versions, labels }: { versions: Version[]; labels: Labels }) {
  const [active, setActive] = useState(Math.max(0, versions.length - 1));
  const v = versions[Math.min(active, versions.length - 1)];
  if (!v) return null;
  return (
    <div>
      {versions.length > 1 && (
        <div className="mb-10">
          <p className="eyebrow mb-4">{labels.versionHistory}</p>
          <div className="relative">
            <div className="absolute left-0 right-0 top-[19px] hidden h-px bg-line md:block" />
            <ol className="flex gap-2 overflow-x-auto pb-2 md:grid md:gap-4" style={{ gridTemplateColumns: `repeat(${versions.length}, minmax(0, 1fr))` }}>
              {versions.map((ver, i) => (
                <li key={i} className="shrink-0">
                  <button
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`relative w-full min-w-[150px] rounded-xl border p-4 text-left transition md:min-w-0 md:border-0 md:bg-transparent md:p-0 ${
                      i === active ? "border-accent/60 bg-accent-soft" : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <span
                      className={`relative z-10 mb-3 hidden h-10 w-10 place-items-center rounded-full border font-mono text-xs transition md:grid ${
                        i === active ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-bg text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`block font-mono text-xs ${i === active ? "text-accent" : "text-muted"}`}>
                      {[ver.label, ver.date].filter(Boolean).join(" · ")}
                    </span>
                    <span className={`mt-1 block text-sm font-medium leading-snug ${i === active ? "text-text" : "text-muted"}`}>{ver.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div key={active} className="reveal grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          {v.images.length ? (
            <Gallery images={v.images} labels={labels} />
          ) : (
            <div className="bg-grid grid aspect-[16/10] place-items-center rounded-xl border border-line bg-surface-2 font-mono text-xs uppercase tracking-widest text-muted">
              {labels.noImages}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {v.label && <span className="rounded-full border border-accent/50 px-2.5 py-0.5 font-mono text-xs text-accent">{v.label}</span>}
            {v.status && <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{v.status}</span>}
          </div>
          {v.name && <h2 className="mt-4 text-2xl font-semibold tracking-tight">{v.name}</h2>}
          {v.date && <p className="mt-1 font-mono text-xs text-muted">{v.date}</p>}
          {v.summary && <p className="mt-5 whitespace-pre-line leading-relaxed text-muted text-pretty">{v.summary}</p>}
          {v.highlights.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {v.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <svg className="mt-1 shrink-0 text-accent" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
          {v.specs.length > 0 && (
            <dl className="mt-8 divide-y divide-line rounded-xl border border-line">
              {v.specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 break-words px-4 py-3 text-sm">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
