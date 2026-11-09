"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Pic from "./Pic";

export type LightboxItem = {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
  details?: { label: string; value: string }[];
  links?: { label: string; url: string }[];
};

export type LightboxLabels = { close: string; previous: string; next: string };

// Full-screen viewer: arrows, Esc, swipe on phones. Rendered into <body> so no parent can clip it.
export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
  labels,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
  labels: LightboxLabels;
}) {
  const n = items.length;
  const box = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const move = (d: number) => onIndex((index + d + n) % n);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      before?.focus?.();
    };
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && n > 1) onIndex((index + 1) % n);
      else if (e.key === "ArrowLeft" && n > 1) onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, n, onClose, onIndex]);

  if (typeof document === "undefined" || !items[index]) return null;
  const it = items[index];
  const hasPanel = Boolean(it.title || it.details?.length || it.links?.length);

  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={it.title || it.caption || it.alt}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white outline-none"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
        <span className="font-mono">{n > 1 ? `${index + 1} / ${n}` : ""}</span>
        <button onClick={onClose} className="rounded-full border border-white/25 px-4 py-1.5 hover:bg-white/10">
          {labels.close}
        </button>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${hasPanel ? "lg:flex-row" : ""}`}>
        <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
          <Pic key={it.src} src={it.src} alt={it.alt} fill sizes="100vw" className="object-contain p-2 md:p-6" />
          {n > 1 && (
            <>
              <button aria-label={labels.previous} onClick={() => move(-1)} className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button aria-label={labels.next} onClick={() => move(1)} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </>
          )}
        </div>
        {hasPanel ? (
          <aside onClick={(e) => e.stopPropagation()} className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-white/10 bg-black/60 p-5 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
            {it.title && <h2 className="text-lg font-semibold leading-snug">{it.title}</h2>}
            {it.caption && <p className="mt-2 text-sm leading-relaxed text-white/75">{it.caption}</p>}
            {!!it.details?.length && (
              <dl className="mt-4 space-y-2 text-sm">
                {it.details.map((d, i) => (
                  <div key={i}>
                    {d.label && <dt className="text-xs uppercase tracking-wider text-white/45">{d.label}</dt>}
                    <dd className="text-white/85">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {!!it.links?.length && (
              <div className="mt-5 flex flex-wrap gap-2">
                {it.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink">
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </aside>
        ) : (
          it.caption && <p className="px-4 pb-4 pt-2 text-center text-sm text-white/80">{it.caption}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
