"use client";
import { useRef, useState } from "react";
import type { Img } from "@/lib/types";
import { moveItem, useAdmin, type Path } from "./context";
import { LibraryPicker, inputCls, useDragSort } from "./ui";
import { isPdf, runLimited } from "./upload";

type Pending = { id: string; name: string; preview: string; file: File; error?: string };

const tileBtn = "grid h-8 w-full place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-25";

// Camera file names ("IMG_2041", "PXL_2025…", "WhatsApp Image …") make bad captions; real names make good ones.
function captionFrom(name: string) {
  const base = name.replace(/\.[^.]+$/, "");
  if (/^(img|pxl|dsc|dcim|photo|image|whatsapp|screenshot|signal|mvimg|vid|pic|scan|doc)[\s_-]?/i.test(base) || /^[\d\s_-]+$/.test(base)) return "";
  const words = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Photo manager: add many at once, drag or arrow to reorder, caption, set as cover, remove.
export default function GalleryEditor({ path, value, cover, coverPath }: { path: Path; value: Img[]; cover?: string; coverPath?: Path }) {
  const { edit, set, uploadImage, toast, undo } = useAdmin();
  const [pending, setPending] = useState<Pending[]>([]);
  const [picker, setPicker] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [altOpen, setAltOpen] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const move = (from: number, to: number) => edit(path, (old) => moveItem((old as Img[]) ?? [], from, to), { step: true });
  const drag = useDragSort(move);

  const upload = async (items: Pending[]) => {
    await runLimited(
      items.map((it) => async () => {
        try {
          const url = await uploadImage(it.file);
          edit(path, (old) => [...((old as Img[]) ?? []), { src: url, caption: captionFrom(it.name), alt: "" }], { step: true });
          setPending((q) => q.filter((x) => x.id !== it.id));
          if (it.preview) URL.revokeObjectURL(it.preview);
        } catch (e) {
          setPending((q) => q.map((x) => (x.id === it.id ? { ...x, error: e instanceof Error ? e.message : "Upload failed" } : x)));
        }
      }),
      3,
    );
  };

  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || isPdf(f));
    if (!files.length) return;
    const items = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
    }));
    setPending((q) => [...q, ...items]);
    upload(items);
  };

  const retry = (it: Pending) => {
    setPending((q) => q.map((x) => (x.id === it.id ? { ...x, error: undefined } : x)));
    upload([{ ...it, error: undefined }]);
  };

  const remove = (i: number) => {
    edit(path, (old) => ((old as Img[]) ?? []).filter((_, j) => j !== i), { step: true });
    setAltOpen(null);
    toast("Photo removed", { label: "Undo", run: undo });
  };

  return (
    <div
      className={`rounded-xl border p-3 transition ${dropping ? "border-accent bg-accent-soft" : "border-line"}`}
      onDragOver={(e) => {
        if (!drag.dragging() && e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDropping(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropping(false);
      }}
      onDrop={(e) => {
        if (drag.dragging() || !e.dataTransfer.files.length) return;
        e.preventDefault();
        setDropping(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {value.map((im, i) => (
          <div key={im.src + i} {...drag.target(i)} className={`overflow-hidden rounded-lg border bg-bg transition ${drag.over === i ? "border-accent ring-2 ring-accent" : "border-line"}`}>
            <div {...drag.handle(i)} className="relative aspect-[4/3] cursor-grab bg-surface-2 active:cursor-grabbing" title="Drag to reorder">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt={im.alt || im.caption} loading="lazy" draggable={false} className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[10px] text-white">{i + 1}</span>
              {cover && cover === im.src && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-ink">Cover</span>}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/65 text-xs text-white transition hover:bg-red-500"
                aria-label={`Remove photo ${i + 1}`}
                title="Remove from this project"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 p-2">
              <input
                className={`${inputCls} !px-2 !py-1.5 !text-sm sm:!text-xs`}
                value={im.caption}
                placeholder="Caption"
                aria-label={`Caption for photo ${i + 1}`}
                onChange={(e) => set(path.concat(i, "caption"), e.target.value)}
              />
              {altOpen === i && (
                <input
                  className={`${inputCls} !px-2 !py-1.5 !text-sm sm:!text-xs`}
                  value={im.alt}
                  placeholder="Alt text: what the photo shows"
                  aria-label={`Alt text for photo ${i + 1}`}
                  onChange={(e) => set(path.concat(i, "alt"), e.target.value)}
                />
              )}
              <div className="grid grid-cols-4 gap-0.5">
                <button type="button" className={tileBtn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move earlier" title="Move earlier">
                  ←
                </button>
                <button type="button" className={tileBtn} disabled={i === value.length - 1} onClick={() => move(i, i + 1)} aria-label="Move later" title="Move later">
                  →
                </button>
                <button type="button" className={`${tileBtn} text-[11px] ${altOpen === i || im.alt ? "!text-accent" : ""}`} onClick={() => setAltOpen(altOpen === i ? null : i)} title="Alt text for screen readers and Google">
                  Alt
                </button>
                {coverPath ? (
                  <button
                    type="button"
                    className={`${tileBtn} ${cover === im.src ? "!text-accent" : ""}`}
                    onClick={() => set(coverPath, cover === im.src ? "" : im.src, { step: true })}
                    title={cover === im.src ? "This is the cover. Tap to unset." : "Make this the cover photo"}
                    aria-label={cover === im.src ? "Unset cover" : "Set as cover"}
                  >
                    ★
                  </button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-line bg-bg">
            <div className="relative aspect-[4/3] bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.preview && <img src={p.preview} alt="" className="h-full w-full object-cover opacity-40" />}
              <span className="absolute inset-0 grid place-items-center px-2 text-center text-xs">
                {p.error ? <span className="text-red-400">{p.error}</span> : <span className="animate-pulse">Uploading…</span>}
              </span>
            </div>
            <div className="flex items-center gap-1 p-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-muted">{p.name}</span>
              {p.error && (
                <>
                  <button type="button" className="text-accent" onClick={() => retry(p)}>
                    Retry
                  </button>
                  <button type="button" className="text-muted" onClick={() => setPending((q) => q.filter((x) => x.id !== p.id))}>
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-accent transition hover:border-accent hover:bg-accent-soft"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-xs font-medium">Add photos</span>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <button type="button" onClick={() => setPicker(true)} className="text-accent hover:underline">
          Choose from uploaded
        </button>
        <span>{value.length} photo{value.length === 1 ? "" : "s"} · pick several at once · drag photos here or drag to reorder</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {picker && (
        <LibraryPicker
          multiple
          onClose={() => setPicker(false)}
          onPick={(srcs) => {
            edit(
              path,
              (old) => {
                const cur = (old as Img[]) ?? [];
                const have = new Set(cur.map((x) => x.src));
                return [...cur, ...srcs.filter((s) => !have.has(s)).map((src) => ({ src, caption: "", alt: "" }))];
              },
              { step: true },
            );
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}
