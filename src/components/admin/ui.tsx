"use client";
import { useEffect, useRef, useState } from "react";
import type { Field } from "@/lib/schema";
import { useAdmin } from "./context";

export const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-base text-text outline-none transition placeholder:text-muted/50 focus:border-accent sm:py-2 sm:text-sm";
export const btnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm text-text transition hover:border-accent hover:text-accent disabled:opacity-40 sm:py-1.5 sm:text-xs";
export const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-25 sm:h-8 sm:w-8";

/* ---------------- small pieces ---------------- */

export function FieldLabel({ field, htmlFor }: { field: Field; htmlFor?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted">
        {field.label}
      </label>
      {field.help && <p className="mt-0.5 text-xs leading-relaxed text-muted/70">{field.help}</p>}
    </div>
  );
}

export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition ${value ? "border-accent bg-accent" : "border-line-strong bg-surface-2"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

export function Thumb({ src, className = "h-10 w-12" }: { src: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className={`${className} shrink-0 rounded-md border border-line object-cover`} />
  ) : (
    <span className={`${className} grid shrink-0 place-items-center rounded-md border border-dashed border-line text-[10px] text-muted/60`}>—</span>
  );
}

// Drag to reorder on desktop (phones use the arrow buttons).
export function useDragSort(onMove: (from: number, to: number) => void) {
  const from = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const handle = (i: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      from.current = i;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
    },
    onDragEnd: () => {
      from.current = null;
      setOver(null);
    },
  });
  const target = (i: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (from.current === null) return;
      e.preventDefault();
      setOver(i);
    },
    onDrop: (e: React.DragEvent) => {
      if (from.current === null) return;
      e.preventDefault();
      if (from.current !== i) onMove(from.current, i);
      from.current = null;
      setOver(null);
    },
  });
  return { handle, target, over, dragging: () => from.current !== null };
}

/* ---------------- library picker ---------------- */

export function LibraryPicker({ onPick, onClose, multiple }: { onPick: (srcs: string[]) => void; onClose: () => void; multiple?: boolean }) {
  const { library } = useAdmin();
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-medium">Choose from uploaded photos</p>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-text">
            Close
          </button>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-5">
          {library.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">No photos yet.</p>}
          {library.map((src) => {
            const on = sel.includes(src);
            return (
              <button
                key={src}
                type="button"
                onClick={() => (multiple ? setSel(on ? sel.filter((x) => x !== src) : [...sel, src]) : onPick([src]))}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${on ? "border-accent" : "border-transparent hover:border-line-strong"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                {on && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">{sel.indexOf(src) + 1}</span>}
              </button>
            );
          })}
        </div>
        {multiple && (
          <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-3">
            <span className="text-xs text-muted">{sel.length} selected</span>
            <button type="button" disabled={!sel.length} onClick={() => onPick(sel)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40">
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

