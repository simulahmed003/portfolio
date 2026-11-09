"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Img, Version } from "@/lib/types";

function Lightbox({ images, index, onClose, onMove }: { images: Img[]; index: number; onClose: () => void; onMove: (d: number) => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose, onMove]);
  const im = images[index];
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4" onClick={onClose}>
      <div className="flex items-center justify-between text-sm text-white/70">
        <span className="font-mono">
          {index + 1} / {images.length}
        </span>
        <button aria-label="Close" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Close</button>
      </div>
      <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
        <Image src={im.src} alt={im.caption} fill sizes="100vw" className="object-contain" />
        {images.length > 1 && (
          <>
            <button aria-label="Previous" onClick={() => onMove(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20">‹</button>
            <button aria-label="Next" onClick={() => onMove(1)} className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20">›</button>
          </>
        )}
      </div>
      <p className="pt-3 text-center text-sm text-white/80">{im.caption}</p>
    </div>
  );
}

export function Gallery({ images }: { images: Img[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const move = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + images.length) % images.length)), [images.length]);
  const close = useCallback(() => setOpen(null), []);
  if (!images.length) return null;
  const [first, ...rest] = images;
  return (
    <>
      <div className="grid gap-3">
        <button onClick={() => setOpen(0)} className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-surface-2 text-left">
          <Image src={first.src} alt={first.caption} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 text-sm text-white/90">{first.caption}</span>
        </button>
        {rest.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {rest.map((im, i) => (
              <button key={im.src + i} onClick={() => setOpen(i + 1)} title={im.caption} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-2">
                <Image src={im.src} alt={im.caption} fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open !== null && <Lightbox images={images} index={open} onClose={close} onMove={move} />}
    </>
  );
}

export default function VersionExplorer({ versions }: { versions: Version[] }) {
  const [active, setActive] = useState(versions.length - 1);
  const v = versions[active];
  return (
    <div>
      {versions.length > 1 && (
        <div className="mb-10">
          <p className="eyebrow mb-4">Version history</p>
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
                    <span className={`relative z-10 mb-3 hidden h-10 w-10 place-items-center rounded-full border font-mono text-xs transition md:grid ${
                      i === active ? "border-accent bg-accent text-[#14100b]" : "border-line-strong bg-bg text-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`block font-mono text-xs ${i === active ? "text-accent" : "text-muted"}`}>
                      {ver.label} · {ver.date}
                    </span>
                    <span className={`mt-1 block text-sm font-medium leading-snug ${i === active ? "text-text" : "text-muted"}`}>{ver.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div key={active} className="reveal grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>{v.images.length ? <Gallery images={v.images} /> : <div className="bg-grid grid aspect-[16/10] place-items-center rounded-xl border border-line bg-surface-2 font-mono text-xs uppercase tracking-widest text-muted">Images coming soon</div>}</div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/50 px-2.5 py-0.5 font-mono text-xs text-accent">{v.label}</span>
            <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{v.status}</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{v.name}</h2>
          <p className="mt-1 font-mono text-xs text-muted">{v.date}</p>
          <p className="mt-5 leading-relaxed text-muted text-pretty">{v.summary}</p>
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
                <div key={i} className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
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
