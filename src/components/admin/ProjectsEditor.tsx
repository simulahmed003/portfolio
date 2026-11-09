"use client";
import { useState } from "react";
import type { Item } from "@/lib/schema";
import { projectShape, versionShape } from "@/lib/schema";
import type { ProjectFamily } from "@/lib/types";
import { newItem } from "@/lib/normalize";
import { moveItem, useAdmin, type Path } from "./context";
import { FieldView, ListEditor, ObjectForm, StatusPills } from "./fields";
import GalleryEditor from "./GalleryEditor";
import ProjectLinksTab, { copyAllLinks, copyProjectLink } from "./ProjectLinks";
import { Thumb, btnCls, iconBtn, inputCls, useDragSort } from "./ui";
import { LinkIcon } from "../ui";

const PATH: Path = ["projects"];
const field = (k: string) => projectShape.fields.find((f) => f.key === k)!;
type Tab = "details" | "photos" | "versions" | "links";
type Filter = "all" | "live" | "hidden" | "featured";

const photos = (p: ProjectFamily) => new Set(p.versions.flatMap((v) => v.images.map((i) => i.src))).size;

export function createProject(edit: ReturnType<typeof useAdmin>["edit"]) {
  const item = newItem(projectShape);
  edit(PATH, (old) => [item, ...((old as Item[]) ?? [])], { step: true });
}

function ProjectDetail({ all, i, onBack, onOpen, githubUser }: { all: ProjectFamily[]; i: number; onBack: () => void; onOpen: (i: number | null) => void; githubUser: string }) {
  const p = all[i];
  const { edit, set, toast, undo } = useAdmin();
  const [tab, setTab] = useState<Tab>("details");
  const path = PATH.concat(i);
  const nPhotos = photos(p);
  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "photos", label: `Photos${nPhotos ? ` (${nPhotos})` : ""}` },
    { id: "versions", label: `Versions (${p.versions.length})` },
    { id: "links", label: `Link & GitHub${p.repos.length ? ` (${p.repos.length})` : ""}` },
  ];
  const addVersion = () => {
    const v = newItem(versionShape);
    v.label = `v${p.versions.length + 1}`;
    edit(path.concat("versions"), (old) => [...((old as Item[]) ?? []), v], { step: true });
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-muted hover:text-text">
        ← All projects
      </button>
      <div className="flex flex-wrap items-start gap-3">
        <Thumb src={projectShape.thumb!(p as unknown as Item)} className="h-16 w-20" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight">{p.title || "Untitled project"}</h2>
          <p className="text-sm text-muted">{[p.category, p.period].filter(Boolean).join(" · ") || "Fill in the details below"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPills item={p as unknown as Item} onToggle={(k) => edit(path.concat(k), (old) => !old, { step: true })} />
          <button type="button" className={btnCls} onClick={() => copyProjectLink(all, i, toast)}>
            <LinkIcon className="h-3.5 w-3.5" /> Copy link
          </button>
          {!p.hidden && p.slug && (
            <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className={btnCls}>
              View ↗
            </a>
          )}
        </div>
      </div>
      {p.hidden && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
          <span className="flex-1 text-muted">This project is hidden, so visitors can&apos;t see it. New projects start hidden so nothing half-finished goes live.</span>
          <button type="button" onClick={() => set(path.concat("hidden"), false, { step: true })} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink">
            Make it live
          </button>
        </div>
      )}

      <div className="sticky top-[134px] z-20 -mx-1 mt-6 flex gap-1 overflow-x-auto border-b border-line bg-bg/95 px-1 backdrop-blur md:top-14">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${tab === t.id ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {tab === "details" && (
          <ObjectForm fields={projectShape.fields} path={path} value={p as unknown as Item} only={["title", "tagline", "category", "period", "organisation", "role", "summary", "tags", "metrics"]} />
        )}

        {tab === "photos" && (
          <div className="space-y-8">
            <FieldView field={{ ...field("cover"), help: "The main picture on the card. Or tap ★ on any photo below to make it the cover." }} path={path.concat("cover")} value={p.cover} />
            {p.versions.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
                Photos belong to a version (v1, v2…). Add the first version to start adding photos.
                <div className="mt-3">
                  <button type="button" className={btnCls} onClick={addVersion}>
                    + Add first version
                  </button>
                </div>
              </div>
            )}
            {p.versions.map((v, k) => (
              <section key={k}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium">
                    {[v.label, v.name].filter(Boolean).join(" · ") || `Version ${k + 1}`}
                    {v.hidden && <span className="ml-2 text-xs text-muted">(hidden)</span>}
                  </h3>
                  <span className="text-xs text-muted">{v.images.length} photos</span>
                </div>
                <GalleryEditor path={path.concat("versions", k, "images")} value={v.images} cover={p.cover} coverPath={path.concat("cover")} />
              </section>
            ))}
          </div>
        )}

        {tab === "versions" && (
          <div>
            <p className="mb-4 text-sm text-muted">Each version keeps its own photos, specs and story. Oldest first: the project page opens on the last one.</p>
            <ListEditor field={field("versions")} path={path.concat("versions")} value={p.versions as unknown as Item[]} />
          </div>
        )}

        {tab === "links" && <ProjectLinksTab all={all} i={i} path={path} githubUser={githubUser} />}
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-5">
        <button type="button" className={btnCls} onClick={onBack}>
          Done
        </button>
        <button
          type="button"
          className={btnCls}
          onClick={() => {
            const copy = JSON.parse(JSON.stringify(p)) as Item;
            copy.title = `${p.title} (copy)`;
            copy.slug = "";
            copy.oldSlugs = [];
            copy.hidden = true;
            edit(PATH, (old) => [...(old as Item[]).slice(0, i + 1), copy, ...(old as Item[]).slice(i + 1)], { step: true });
            onOpen(i + 1);
            toast("Duplicated. The copy starts hidden.");
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className={`${btnCls} ml-auto hover:!border-red-400 hover:!text-red-400`}
          onClick={() => {
            edit(PATH, (old) => (old as Item[]).filter((_, j) => j !== i), { step: true });
            onOpen(null);
            toast(`Deleted “${p.title || "project"}”`, { label: "Undo", run: undo });
          }}
        >
          Delete project
        </button>
      </div>
    </div>
  );
}

export default function ProjectsEditor({ value, open, onOpen, githubUser }: { value: ProjectFamily[]; open: number | null; onOpen: (i: number | null) => void; githubUser: string }) {
  const { edit, toast } = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    edit(PATH, (old) => moveItem(old as Item[], from, to), { step: true });
  };
  const drag = useDragSort(move);

  if (open !== null && value[open]) return <ProjectDetail key={open} all={value} i={open} onBack={() => onOpen(null)} onOpen={onOpen} githubUser={githubUser} />;

  const counts = {
    all: value.length,
    live: value.filter((p) => !p.hidden).length,
    hidden: value.filter((p) => p.hidden).length,
    featured: value.filter((p) => p.featured).length,
  };
  const query = q.trim().toLowerCase();
  const rows = value
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => (filter === "live" ? !p.hidden : filter === "hidden" ? p.hidden : filter === "featured" ? p.featured : true))
    .filter(({ p }) => !query || [p.title, p.category, p.organisation, ...p.tags].join(" ").toLowerCase().includes(query));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => {
            createProject(edit);
            onOpen(0);
          }}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink sm:py-2"
        >
          + New project
        </button>
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={() => copyAllLinks(value, toast)} className={`${btnCls} sm:ml-auto`} title="Copies “Project: link” for every live project, one per line, for your CV">
          <LinkIcon className="h-3.5 w-3.5" /> Copy all links for CV
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["all", "live", "hidden", "featured"] as Filter[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${filter === k ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-text"}`}
          >
            {k} <span className="opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">The order here is the order on the website. Featured projects show as large cards first.</p>
      <div className="mt-3 space-y-2">
        {rows.map(({ p, i }) => (
          <div key={i} {...drag.target(i)} className={`flex items-center gap-1.5 rounded-xl border bg-surface/60 px-2 py-2 transition sm:gap-2 sm:px-3 ${drag.over === i ? "border-accent ring-2 ring-accent" : "border-line"} ${p.hidden ? "opacity-70" : ""}`}>
            <span {...drag.handle(i)} title="Drag to reorder" className="hidden cursor-grab select-none px-1 text-muted/50 hover:text-muted active:cursor-grabbing sm:block">
              ⋮⋮
            </span>
            <button type="button" onClick={() => onOpen(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Thumb src={projectShape.thumb!(p as unknown as Item)} className="h-12 w-16" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.title || "Untitled project"}</span>
                <span className="block truncate text-xs text-muted">{[p.category, p.period].filter(Boolean).join(" · ")}</span>
                <span className="block truncate text-[11px] text-muted/70">
                  {p.versions.length} version{p.versions.length === 1 ? "" : "s"} · {photos(p)} photos
                </span>
              </span>
            </button>
            <StatusPills item={p as unknown as Item} onToggle={(k) => edit(PATH.concat(i, k), (old) => !old, { step: true })} />
            <button type="button" className={iconBtn} onClick={() => copyProjectLink(value, i, toast)} title="Copy link to this project" aria-label={`Copy link to ${p.title || "project"}`}>
              <LinkIcon className="h-4 w-4" />
            </button>
            <div className="flex shrink-0 flex-col sm:flex-row">
              <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                ↓
              </button>
            </div>
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-sm text-muted">No projects here.</p>}
      </div>
    </div>
  );
}
