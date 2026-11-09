"use client";
import { useRef, useState } from "react";

/* Generic editor: renders inputs for any JSON value, so every text and image on the site is editable. */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type Uploader = (file: File, kind: "image" | "file") => Promise<string>;

const IMAGE_KEYS = /^(photo|image|cover|src)$/i;
const FILE_KEYS = /^(cvUrl)$/i;
const LONG_KEYS = /^(summary|intro|text|detail|description|paragraphs|tagline|headline)$/i;

const HINTS: Record<string, string> = {
  slug: "Web address of the project page, e.g. line-following-robot. Lowercase, no spaces.",
  featured: "Show as a large card at the top of the projects section.",
  hidden: "Hide from the public site without deleting it.",
  category: "Projects are grouped by this on the All projects page.",
  label: "Short version tag shown on the timeline, e.g. v1, v2, Prototype.",
};

export function humanize(key: string) {
  const s = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function blankFrom(sample: Json): Json {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    const o: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample)) o[k] = blankFrom(v);
    return o;
  }
  if (typeof sample === "boolean") return false;
  if (typeof sample === "number") return 0;
  return "";
}

export function itemTitle(v: Json, i: number): string {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of ["title", "name", "role", "label", "group", "school", "caption", "value"]) {
      const x = (v as Record<string, Json>)[k];
      if (typeof x === "string" && x.trim()) {
        const extra = k === "label" && typeof (v as Record<string, Json>).name === "string" ? ` · ${(v as Record<string, Json>).name}` : "";
        return x + extra;
      }
    }
  }
  if (typeof v === "string") return v || `Item ${i + 1}`;
  return `Item ${i + 1}`;
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted/50 focus:border-accent";

function ImageInput({ value, onChange, upload, kind }: { value: string; onChange: (v: string) => void; upload: Uploader; kind: "image" | "file" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="flex items-start gap-3">
      {kind === "image" && (
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-[10px] text-muted">No image</span>
          )}
        </div>
      )}
      <div className="flex-1 space-y-2">
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={kind === "image" ? "Image URL, or upload" : "File URL, or upload"} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => ref.current?.click()}
            className="rounded-md border border-line-strong px-3 py-1.5 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {busy ? "Uploading…" : kind === "image" ? "Upload image" : "Upload file"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-muted hover:text-red-400">
              Remove
            </button>
          )}
          {err && <span className="text-xs text-red-400">{err}</span>}
        </div>
        <input
          ref={ref}
          type="file"
          accept={kind === "image" ? "image/*" : ".pdf,application/pdf"}
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              onChange(await upload(f, kind));
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full border transition ${value ? "border-accent bg-accent" : "border-line-strong bg-surface-2"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`} />
    </button>
  );
}

function ArrayEditor({ k, value, onChange, upload, sample }: { k: string; value: Json[]; onChange: (v: Json[]) => void; upload: Uploader; sample?: Json }) {
  const [open, setOpen] = useState<number | null>(null);
  const isStrings = value.length ? value.every((x) => typeof x === "string") : typeof sample === "string" || sample === undefined;
  const template = value[0] ?? sample ?? "";
  const set = (i: number, v: Json) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const a = [...value];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
    if (open === i) setOpen(j);
  };
  const remove = (i: number) => {
    if (!confirm(`Remove "${itemTitle(value[i], i)}"?`)) return;
    onChange(value.filter((_, j) => j !== i));
    setOpen(null);
  };
  const add = () => {
    onChange([...value, blankFrom(template)]);
    setOpen(value.length);
  };
  const small = "rounded px-1.5 py-0.5 text-xs text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30";

  if (isStrings) {
    const long = LONG_KEYS.test(k);
    return (
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            {long ? (
              <textarea className={inputCls} rows={3} value={s as string} onChange={(e) => set(i, e.target.value)} />
            ) : (
              <input className={inputCls} value={s as string} onChange={(e) => set(i, e.target.value)} />
            )}
            <div className="flex shrink-0 flex-col">
              <button type="button" className={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className={small} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            </div>
            <button type="button" className={`${small} mt-1.5 hover:text-red-400`} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, ""])} className="text-xs text-accent hover:underline">
          + Add line
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className={`rounded-xl border ${open === i ? "border-line-strong bg-surface" : "border-line"}`}>
          <div className="flex items-center gap-2 px-3 py-2">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex flex-1 items-center gap-2 text-left text-sm">
              <span className={`text-muted transition ${open === i ? "rotate-90" : ""}`}>›</span>
              {item && typeof item === "object" && !Array.isArray(item) && typeof (item as Record<string, Json>).src === "string" && (item as Record<string, Json>).src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(item as Record<string, Json>).src as string} alt="" className="h-8 w-10 rounded object-cover" />
              ) : null}
              <span className="line-clamp-1">{itemTitle(item, i)}</span>
              {item && typeof item === "object" && (item as Record<string, Json>).hidden === true && (
                <span className="rounded bg-surface-2 px-1.5 text-[10px] text-muted">hidden</span>
              )}
            </button>
            <button type="button" className={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
            <button type="button" className={small} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            <button type="button" className={small} onClick={() => { onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)]); setOpen(i + 1); }} aria-label="Duplicate">⧉</button>
            <button type="button" className={`${small} hover:text-red-400`} onClick={() => remove(i)} aria-label="Remove">✕</button>
          </div>
          {open === i && (
            <div className="border-t border-line p-4">
              <FieldEditor value={item} onChange={(v) => set(i, v)} upload={upload} />
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-accent hover:border-accent">
        + Add {humanize(k).replace(/s$/, "").toLowerCase() || "item"}
      </button>
    </div>
  );
}

export default function FieldEditor({ value, onChange, upload, k = "", sample }: { value: Json; onChange: (v: Json) => void; upload: Uploader; k?: string; sample?: Json }) {
  if (Array.isArray(value)) {
    const s = Array.isArray(sample) ? sample[0] : undefined;
    return <ArrayEditor k={k} value={value} onChange={onChange} upload={upload} sample={s} />;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <div className="space-y-5">
        {entries.map(([key, v]) => {
          const isObj = v !== null && typeof v === "object";
          const subSample = sample && typeof sample === "object" && !Array.isArray(sample) ? (sample as Record<string, Json>)[key] : undefined;
          return (
            <div key={key} className={isObj ? "rounded-xl border border-line p-4" : ""}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">{humanize(key)}</label>
                {Array.isArray(v) && <span className="font-mono text-[10px] text-muted/70">{v.length} items</span>}
              </div>
              {HINTS[key] && <p className="-mt-0.5 mb-2 text-xs text-muted/70">{HINTS[key]}</p>}
              <FieldEditor k={key} value={v} sample={subSample} upload={upload} onChange={(nv) => onChange({ ...(value as Record<string, Json>), [key]: nv })} />
            </div>
          );
        })}
      </div>
    );
  }
  if (typeof value === "boolean") return <Toggle value={value} onChange={onChange} />;
  if (typeof value === "number") return <input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} />;
  const s = (value ?? "") as string;
  if (IMAGE_KEYS.test(k)) return <ImageInput value={s} onChange={onChange} upload={upload} kind="image" />;
  if (FILE_KEYS.test(k)) return <ImageInput value={s} onChange={onChange} upload={upload} kind="file" />;
  if (LONG_KEYS.test(k) || s.length > 90) return <textarea className={inputCls} rows={Math.min(10, Math.max(3, Math.ceil(s.length / 90)))} value={s} onChange={(e) => onChange(e.target.value)} />;
  return <input className={inputCls} value={s} onChange={(e) => onChange(e.target.value)} />;
}

export type { Json };
