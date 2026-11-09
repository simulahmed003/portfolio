"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Field, Item } from "@/lib/schema";
import type { Img } from "@/lib/types";
import { newItem } from "@/lib/normalize";
import { moveItem, useAdmin, type Path } from "./context";
import GalleryEditor from "./GalleryEditor";
import { FieldLabel, LibraryPicker, Switch, Thumb, btnCls, iconBtn, inputCls, useDragSort } from "./ui";

export { inputCls, btnCls, iconBtn };

function AutoTextarea({ id, value, onChange, placeholder, minRows = 3 }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 520)}px`;
  }, [value]);
  return <textarea id={id} ref={ref} rows={minRows} className={`${inputCls} resize-y leading-relaxed`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

/* ---------------- image and file ---------------- */

function ImageField({ field, path, value, pdfPath }: { field: Field; path: Path; value: string; pdfPath?: Path }) {
  const { edit, set: setValue, uploadImage } = useAdmin();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [picker, setPicker] = useState(false);
  const [drag, setDrag] = useState(false);
  const id = useId();
  const set = (v: string) => setValue(path, v, { step: true });
  const take = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const url = await uploadImage(f, pdfPath ? (pdf) => edit(pdfPath, (old) => (old ? old : pdf), { step: true }) : undefined);
      set(url);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <FieldLabel field={field} htmlFor={id} />
      <div
        className={`flex flex-col gap-3 rounded-xl border p-3 transition sm:flex-row sm:items-start ${drag ? "border-accent bg-accent-soft" : "border-line"}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDrag(true);
          }
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files[0]);
        }}
      >
        <button type="button" onClick={() => ref.current?.click()} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-36" aria-label="Upload image">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center px-2 text-center text-xs text-muted">{busy ? "Uploading…" : "Tap to add a photo"}</span>
          )}
          {busy && value && <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs">Uploading…</span>}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={btnCls}>
              {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            <button type="button" onClick={() => setPicker(true)} className={btnCls}>
              Choose uploaded
            </button>
            {value && (
              <button type="button" onClick={() => set("")} className={`${btnCls} hover:!border-red-400 hover:!text-red-400`}>
                Remove
              </button>
            )}
          </div>
          <input id={id} className={`${inputCls} font-mono !text-xs`} value={value} placeholder="or paste an image address" onChange={(e) => setValue(path, e.target.value)} />
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
        <input
          ref={ref}
          type="file"
          accept={pdfPath ? "image/*,.pdf,application/pdf" : "image/*,.pdf,application/pdf"}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            take(f);
          }}
        />
      </div>
      {picker && (
        <LibraryPicker
          onClose={() => setPicker(false)}
          onPick={(s) => {
            set(s[0]);
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

function FileField({ field, path, value }: { field: Field; path: Path; value: string }) {
  const { edit, set, uploadFile } = useAdmin();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const id = useId();
  const name = value ? decodeURIComponent(value.split("/").pop() ?? "").replace(/^[a-z0-9]+-[a-z0-9]{4}-/, "") : "";
  return (
    <div>
      <FieldLabel field={field} htmlFor={id} />
      <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className="truncate text-sm text-accent hover:underline">
            📄 {name || value} ↗
          </a>
        ) : (
          <p className="text-sm text-muted">No file yet.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={btnCls}>
            {busy ? "Uploading…" : value ? "Replace file" : "Upload file"}
          </button>
          {value && (
            <button type="button" onClick={() => edit(path, () => "", { step: true })} className={`${btnCls} hover:!border-red-400 hover:!text-red-400`}>
              Remove
            </button>
          )}
        </div>
        <input id={id} className={`${inputCls} font-mono !text-xs`} value={value} placeholder="or paste a file address" onChange={(e) => set(path, e.target.value)} />
        {err && <p className="text-xs text-red-400">{err}</p>}
        <input
          ref={ref}
          type="file"
          accept={field.accept}
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              const url = await uploadFile(f);
              edit(path, () => url, { step: true });
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

/* ---------------- choices, tags, lines, colour ---------------- */

function SelectField({ field, path, value }: { field: Field; path: Path; value: string }) {
  const { edit, set, categories } = useAdmin();
  const id = useId();
  const base = field.key === "category" ? Array.from(new Set([...(field.options ?? []), ...categories])) : field.options ?? [];
  const options = value && !base.includes(value) ? [...base, value] : base;
  return (
    <div>
      <FieldLabel field={field} htmlFor={id} />
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => edit(path, () => (value === o ? "" : o), { step: true })}
            aria-pressed={value === o}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${value === o ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-line-strong hover:text-text"}`}
          >
            {o}
          </button>
        ))}
      </div>
      <input id={id} className={`${inputCls} mt-2`} value={value} placeholder="or type your own" onChange={(e) => set(path, e.target.value)} />
    </div>
  );
}

function TagsField({ field, path, value }: { field: Field; path: Path; value: string[] }) {
  const { edit } = useAdmin();
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s));
    if (parts.length) edit(path, (old) => [...((old as string[]) ?? []), ...parts], { step: true });
    setDraft("");
  };
  return (
    <div>
      <FieldLabel field={field} htmlFor={id} />
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-bg p-2 focus-within:border-accent">
        {value.map((t, i) => (
          <span key={t + i} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-2 py-1 pl-3 pr-1 text-xs">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => edit(path, (old) => (old as string[]).filter((_, j) => j !== i), { step: true })} className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-bg hover:text-red-400">
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) edit(path, (old) => (old as string[]).slice(0, -1), { step: true });
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "Add more…" : field.placeholder ? `e.g. ${field.placeholder}` : "Type and press Enter"}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-base outline-none placeholder:text-muted/50 sm:text-sm"
        />
      </div>
    </div>
  );
}

function LinesField({ field, path, value }: { field: Field; path: Path; value: string[] }) {
  const { edit, set } = useAdmin();
  const refs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([]);
  const [focusNext, setFocusNext] = useState<number | null>(null);
  useEffect(() => {
    if (focusNext !== null) {
      refs.current[focusNext]?.focus();
      setFocusNext(null);
    }
  }, [focusNext, value.length]);
  const insertAfter = (i: number) => {
    edit(path, (old) => {
      const a = [...((old as string[]) ?? [])];
      a.splice(i + 1, 0, "");
      return a;
    }, { step: true });
    setFocusNext(i + 1);
  };
  return (
    <div>
      <FieldLabel field={field} />
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="mt-2.5 w-4 shrink-0 text-right font-mono text-[10px] text-muted/60">{i + 1}</span>
            {field.long ? (
              <textarea
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={`${inputCls} min-h-[96px] leading-relaxed`}
                value={s}
                onChange={(e) => set(path.concat(i), e.target.value)}
              />
            ) : (
              <input
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={inputCls}
                value={s}
                onChange={(e) => set(path.concat(i), e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertAfter(i);
                  }
                }}
              />
            )}
            <div className="flex shrink-0 flex-col sm:flex-row">
              <button type="button" className={iconBtn} disabled={i === 0} onClick={() => edit(path, (old) => moveItem(old as string[], i, i - 1), { step: true })} aria-label="Move up">
                ↑
              </button>
              <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => edit(path, (old) => moveItem(old as string[], i, i + 1), { step: true })} aria-label="Move down">
                ↓
              </button>
            </div>
            <button type="button" className={`${iconBtn} hover:!text-red-400`} onClick={() => edit(path, (old) => (old as string[]).filter((_, j) => j !== i), { step: true })} aria-label="Remove line">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => insertAfter(value.length - 1)} className="text-sm text-accent hover:underline sm:text-xs">
          + Add {field.long ? "paragraph" : "line"}
        </button>
      </div>
    </div>
  );
}

const SWATCHES = ["#e3a061", "#f2c14e", "#53c28b", "#2dd4bf", "#5b9dff", "#a78bfa", "#fb7185", "#e9edf2"];

function ColorField({ field, path, value }: { field: Field; path: Path; value: string }) {
  const { edit, set } = useAdmin();
  const id = useId();
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <div>
      <FieldLabel field={field} htmlFor={id} />
      <div className="flex flex-wrap items-center gap-3">
        <input type="color" aria-label={field.label} value={valid && value.length === 7 ? value : "#e3a061"} onChange={(e) => set(path, e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-bg" />
        <input id={id} className={`${inputCls} w-32 font-mono`} value={value} onChange={(e) => set(path, e.target.value)} placeholder="#e3a061" />
        <div className="flex gap-1.5">
          {SWATCHES.map((c) => (
            <button key={c} type="button" title={c} onClick={() => edit(path, () => c, { step: true })} className={`h-7 w-7 rounded-full border-2 ${value.toLowerCase() === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      {!valid && value && <p className="mt-1 text-xs text-red-400">Use a colour like #e3a061. The default is used until then.</p>}
    </div>
  );
}

/* ---------------- dispatcher and forms ---------------- */

export function FieldView({ field, path, value, pdfPath }: { field: Field; path: Path; value: unknown; pdfPath?: Path }) {
  const { edit, set } = useAdmin();
  const id = useId();
  const s = typeof value === "string" ? value : "";
  switch (field.kind) {
    case "toggle":
      return (
        <div className="flex items-start gap-3">
          <Switch value={Boolean(value)} onChange={(v) => edit(path, () => v, { step: true })} label={field.label} />
          <div className="-mt-0.5">
            <p className="text-sm">{field.label}</p>
            {field.help && <p className="text-xs leading-relaxed text-muted/70">{field.help}</p>}
          </div>
        </div>
      );
    case "textarea":
      return (
        <div>
          <FieldLabel field={field} htmlFor={id} />
          <AutoTextarea id={id} value={s} onChange={(v) => edit(path, () => v)} placeholder={field.placeholder} />
        </div>
      );
    case "number":
      return (
        <div>
          <FieldLabel field={field} htmlFor={id} />
          <input id={id} type="number" inputMode="numeric" className={`${inputCls} max-w-[10rem]`} value={typeof value === "number" ? value : 0} onChange={(e) => set(path, Number(e.target.value) || 0)} />
        </div>
      );
    case "image":
      return <ImageField field={field} path={path} value={s} pdfPath={pdfPath} />;
    case "file":
      return <FileField field={field} path={path} value={s} />;
    case "select":
      return <SelectField field={field} path={path} value={s} />;
    case "tags":
      return <TagsField field={field} path={path} value={(value as string[]) ?? []} />;
    case "lines":
      return <LinesField field={field} path={path} value={(value as string[]) ?? []} />;
    case "color":
      return <ColorField field={field} path={path} value={s} />;
    case "gallery":
      return (
        <div>
          <FieldLabel field={field} />
          <GalleryEditor path={path} value={(value as Img[]) ?? []} />
        </div>
      );
    case "group":
      return (
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted">{field.label}</legend>
          {field.help && <p className="mb-3 text-xs text-muted/70">{field.help}</p>}
          <ObjectForm fields={field.fields ?? []} path={path} value={(value as Item) ?? {}} />
        </fieldset>
      );
    case "list":
      return (
        <div>
          <FieldLabel field={field} />
          <ListEditor field={field} path={path} value={(value as Item[]) ?? []} />
        </div>
      );
    default:
      return (
        <div>
          <FieldLabel field={field} htmlFor={id} />
          <div className="flex items-center gap-2">
            <input
              id={id}
              type={field.kind === "email" ? "email" : field.kind === "url" ? "url" : "text"}
              inputMode={field.kind === "url" ? "url" : field.kind === "email" ? "email" : undefined}
              className={inputCls}
              value={s}
              placeholder={field.placeholder}
              onChange={(e) => set(path, e.target.value)}
            />
            {field.kind === "url" && /^https?:\/\//.test(s) && (
              <a href={s} target="_blank" rel="noreferrer" className={iconBtn} title="Open link">
                ↗
              </a>
            )}
          </div>
        </div>
      );
  }
}

// Lays out a set of fields: half-width ones pair up on wide screens, advanced ones fold away.
export function ObjectForm({ fields, path, value, only, skip }: { fields: Field[]; path: Path; value: Item; only?: string[]; skip?: string[] }) {
  let list = only ? (only.map((k) => fields.find((f) => f.key === k)).filter(Boolean) as Field[]) : fields;
  if (skip) list = list.filter((f) => !skip.includes(f.key));
  const main = list.filter((f) => !f.advanced);
  const more = list.filter((f) => f.advanced);
  const pdf = fields.find((f) => f.kind === "file" && f.accept?.includes("pdf"));
  const render = (f: Field) => (
    <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
      <FieldView field={f} path={path.concat(f.key)} value={value[f.key]} pdfPath={f.kind === "image" && pdf ? path.concat(pdf.key) : undefined} />
    </div>
  );
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      {main.map(render)}
      {more.length > 0 && (
        <details className="group sm:col-span-2">
          <summary className="cursor-pointer select-none text-xs text-muted hover:text-text">More options</summary>
          <div className="mt-4 grid gap-x-4 gap-y-5 sm:grid-cols-2">{more.map(render)}</div>
        </details>
      )}
    </div>
  );
}

/* ---------------- lists ---------------- */

export function StatusPills({ item, onToggle }: { item: Item; onToggle: (key: "hidden" | "featured") => void }) {
  return (
    <>
      {typeof item.featured === "boolean" && (
        <button
          type="button"
          title="Featured"
          onClick={() => onToggle("featured")}
          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${item.featured ? "border-accent/60 text-accent" : "border-line text-muted hover:text-text"}`}
        >
          ★<span className="hidden sm:inline"> {item.featured ? "Featured" : "Normal"}</span>
        </button>
      )}
      {typeof item.hidden === "boolean" && (
        <button
          type="button"
          title="Live = on the website. Hidden = kept here but not shown."
          onClick={() => onToggle("hidden")}
          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${item.hidden ? "border-line text-muted" : "border-green/60 text-green"}`}
        >
          {item.hidden ? "○ Hidden" : "● Live"}
        </button>
      )}
    </>
  );
}

export function ListEditor({ field, path, value }: { field: Field; path: Path; value: Item[] }) {
  const shape = field.item!;
  const { edit, toast, undo } = useAdmin();
  const [open, setOpen] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const openItem = open !== null ? value[open] : null;
    const next = moveItem(value, from, to);
    edit(path, () => next, { step: true });
    setOpen(openItem ? next.indexOf(openItem) : null);
  };
  const drag = useDragSort(move);
  const remove = (i: number) => {
    const title = shape.title(value[i]);
    edit(path, (old) => (old as Item[]).filter((_, j) => j !== i), { step: true });
    setOpen(null);
    toast(`Deleted “${title}”`, { label: "Undo", run: undo });
  };
  const duplicate = (i: number) => {
    const copy = JSON.parse(JSON.stringify(value[i])) as Item;
    if (typeof copy.title === "string") copy.title = `${copy.title} (copy)`;
    if (typeof copy.slug === "string") copy.slug = "";
    if (Array.isArray(copy.oldSlugs)) copy.oldSlugs = [];
    edit(path, (old) => [...(old as Item[]).slice(0, i + 1), copy, ...(old as Item[]).slice(i + 1)], { step: true });
    setOpen(i + 1);
  };
  const add = () => {
    const item = newItem(shape);
    edit(path, (old) => [...((old as Item[]) ?? []), item], { step: true });
    setOpen(value.length);
  };
  const query = q.trim().toLowerCase();
  const rows = value.map((item, i) => ({ item, i })).filter(({ item }) => !query || `${shape.title(item)} ${shape.subtitle?.(item) ?? ""}`.toLowerCase().includes(query));

  return (
    <div className="space-y-2">
      {value.length > 8 && <input className={inputCls} placeholder={`Search ${value.length} ${shape.noun}s`} value={q} onChange={(e) => setQ(e.target.value)} />}
      {rows.map(({ item, i }) => {
        const isOpen = open === i;
        const sub = shape.subtitle?.(item);
        return (
          <div key={i} {...drag.target(i)} className={`rounded-xl border transition ${isOpen ? "border-line-strong bg-surface" : "border-line"} ${drag.over === i ? "ring-2 ring-accent" : ""} ${item.hidden === true ? "opacity-70" : ""}`}>
            <div className="flex items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3">
              <span {...drag.handle(i)} title="Drag to reorder" className="hidden cursor-grab select-none px-1 text-muted/50 hover:text-muted active:cursor-grabbing sm:block">
                ⋮⋮
              </span>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-left">
                {shape.thumb && <Thumb src={shape.thumb(item)} />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{shape.title(item)}</span>
                  {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
                </span>
              </button>
              <StatusPills item={item} onToggle={(k) => edit(path.concat(i, k), (old) => !old, { step: true })} />
              <div className="flex shrink-0">
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                  ↓
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-line p-4">
                <ObjectForm fields={shape.fields} path={path.concat(i)} value={item} />
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button type="button" className={btnCls} onClick={() => setOpen(null)}>
                    Done
                  </button>
                  <button type="button" className={btnCls} onClick={() => duplicate(i)}>
                    Duplicate
                  </button>
                  <button type="button" className={`${btnCls} ml-auto hover:!border-red-400 hover:!text-red-400`} onClick={() => remove(i)}>
                    Delete {shape.noun}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {query && !rows.length && <p className="py-4 text-center text-sm text-muted">Nothing matches “{q}”.</p>}
      <button type="button" onClick={add} className="w-full rounded-xl border border-dashed border-line-strong px-3 py-3 text-sm text-accent transition hover:border-accent sm:w-auto sm:py-2 sm:text-xs">
        + Add {shape.noun}
      </button>
    </div>
  );
}

