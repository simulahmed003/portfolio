"use client";
import { useCallback, useEffect, useState } from "react";
import type { ProjectFamily, Repo } from "@/lib/types";
import { parseRepo, projectShape, type Item } from "@/lib/schema";
import { fixSlugs, slugify } from "@/lib/normalize";
import { copyText } from "@/lib/clipboard";
import { useAdmin, type Path } from "./context";
import { ListEditor } from "./fields";
import { btnCls, inputCls } from "./ui";

// The address visitors use. The configured site address wins, so links copied while the admin is open
// on a preview or a second domain still point at the real site.
export function siteBase() {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  return (env || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
}
export const projectUrl = (slug: string) => `${siteBase()}/projects/${slug}`;

// The address a project has now, or the one it will get on the next save.
export function addressOf(all: ProjectFamily[], i: number) {
  return all[i]?.slug || fixSlugs(all)[i]?.slug || "";
}

export async function copyProjectLink(all: ProjectFamily[], i: number, toast: (m: string) => void) {
  const p = all[i];
  if (!p) return;
  if (!p.slug) return toast("Save first: a new project gets its address when you save.");
  const ok = await copyText(projectUrl(p.slug));
  if (!ok) return toast("Could not copy. Long-press the address in the Links tab instead.");
  toast(p.hidden ? "Link copied. This project is hidden, so the link opens once you make it live." : "Link copied. Paste it into your CV.");
}

export function copyAllLinks(all: ProjectFamily[], toast: (m: string) => void) {
  const live = all.filter((p) => !p.hidden && p.slug && p.title.trim());
  if (!live.length) return toast("No live projects with an address yet. Save first.");
  copyText(live.map((p) => `${p.title}: ${projectUrl(p.slug)}`).join("\n")).then((ok) =>
    toast(ok ? `Copied ${live.length} project links, one per line.` : "Could not copy in this browser."),
  );
}

/* ---------------- share link ---------------- */

function ShareLink({ all, i, path }: { all: ProjectFamily[]; i: number; path: Path }) {
  const { edit, toast, undo } = useAdmin();
  const p = all[i];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.slug);
  const address = addressOf(all, i);
  const url = projectUrl(address);
  const taken = new Set(all.flatMap((o, k) => (k === i ? [] : [o.slug, ...o.oldSlugs])).filter(Boolean));
  const next = slugify(draft);
  const problem = !next ? "Use letters or numbers." : next !== p.slug && taken.has(next) ? "Another project already uses this address." : "";

  const apply = () => {
    if (problem) return;
    if (next !== p.slug) {
      edit(
        path,
        (old) => {
          const o = old as Item;
          const prev = typeof o.slug === "string" ? o.slug : "";
          const olds = (Array.isArray(o.oldSlugs) ? (o.oldSlugs as string[]) : []).filter((s) => s !== next);
          return { ...o, slug: next, oldSlugs: prev && !olds.includes(prev) ? [...olds, prev] : olds };
        },
        { step: true },
      );
      toast(p.slug ? "Address changed. The old link keeps working. Save to publish." : "Address set. Save to publish.");
    }
    setEditing(false);
  };

  const dropOld = (s: string) => {
    edit(path.concat("oldSlugs"), (old) => ((old as string[]) ?? []).filter((x) => x !== s), { step: true });
    toast(`/projects/${s} will no longer open this project.`, { label: "Undo", run: undo });
  };

  return (
    <section className="rounded-xl border border-line bg-surface/60 p-4">
      <h3 className="text-sm font-medium">Link to this project</h3>
      <p className="mt-0.5 text-xs text-muted">Put it on your CV, LinkedIn or in an email. It keeps working even if you rename the project.</p>
      {!editing ? (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={`${inputCls} font-mono !text-xs`} aria-label="Project link" />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink sm:py-1.5 sm:text-xs"
                onClick={async () => toast((await copyText(url)) ? (p.slug ? "Link copied." : "Link copied. It starts working after you save.") : "Could not copy. Select the address and copy it.")}
              >
                Copy link
              </button>
              {p.slug && !p.hidden && (
                <a href={url} target="_blank" rel="noreferrer" className={btnCls}>
                  Open ↗
                </a>
              )}
              <button
                type="button"
                className={btnCls}
                onClick={() => {
                  setDraft(address);
                  setEditing(true);
                }}
              >
                Change…
              </button>
            </div>
          </div>
          {!p.slug && <p className="mt-2 text-xs text-muted">New project: this address is saved with your next Save and publish.</p>}
          {p.hidden && <p className="mt-2 text-xs text-muted">This project is hidden, so the link shows “page not found” until you make it live.</p>}
        </>
      ) : (
        <div className="mt-3">
          <div className="flex items-center overflow-hidden rounded-lg border border-line bg-bg focus-within:border-accent">
            <span className="hidden shrink-0 pl-3 font-mono text-xs text-muted sm:block">{siteBase().replace(/^https?:\/\//, "")}/projects/</span>
            <span className="shrink-0 pl-3 font-mono text-xs text-muted sm:hidden">/projects/</span>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
                if (e.key === "Escape") setEditing(false);
              }}
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 font-mono text-base outline-none sm:py-2 sm:text-xs"
              aria-label="New address"
            />
          </div>
          <p className={`mt-1.5 text-xs ${problem ? "text-red-400" : "text-muted"}`}>
            {problem || (next !== draft ? `Will be saved as “${next}”. ` : "") + (p.slug && next !== p.slug ? "The old address will keep opening this project." : "")}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={!!problem} onClick={apply} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40 sm:py-1.5 sm:text-xs">
              Use this address
            </button>
            <button type="button" onClick={() => setEditing(false)} className={btnCls}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {p.oldSlugs.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs text-muted">Earlier addresses that still open this project:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {p.oldSlugs.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
                /projects/{s}
                <button type="button" onClick={() => dropOld(s)} className="ml-0.5 hover:text-red-400" aria-label={`Stop redirecting /projects/${s}`}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- GitHub repositories ---------------- */

type GhRepo = { name: string; html_url: string; description: string | null; language: string | null; fork: boolean; pushed_at: string; archived: boolean };

// Lists the public repositories of a GitHub account (GitHub's public API, no sign-in) so they can be ticked.
function RepoPicker({ initialUser, have, onPick, onClose }: { initialUser: string; have: Set<string>; onPick: (r: Repo[]) => void; onClose: () => void }) {
  const [user, setUser] = useState(initialUser);
  const [repos, setRepos] = useState<GhRepo[] | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [paste, setPaste] = useState("");

  const load = useCallback(async (u: string) => {
    const name = u.trim().replace(/^@/, "");
    if (!name) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=pushed`, { headers: { Accept: "application/vnd.github+json" } });
      if (r.status === 404) throw new Error(`There is no GitHub account called “${name}”.`);
      if (r.status === 403 || r.status === 429) throw new Error("GitHub asks to wait a few minutes. You can still paste an address below.");
      if (!r.ok) throw new Error(`GitHub answered with error ${r.status}.`);
      setRepos(((await r.json()) as GhRepo[]).filter((x) => !x.fork));
    } catch (e) {
      setRepos(null);
      setErr(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Could not reach GitHub. Check the connection, or paste an address below.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser) load(initialUser);
  }, [initialUser, load]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const key = (u: string) => u.toLowerCase().replace(/\/+$/, "");
  const query = q.trim().toLowerCase();
  const rows = (repos ?? []).filter((r) => !query || `${r.name} ${r.description ?? ""} ${r.language ?? ""}`.toLowerCase().includes(query));
  const pasted = parseRepo(paste);

  const done = () => {
    const picked = (repos ?? []).filter((r) => sel.includes(r.html_url)).map((r) => ({ url: r.html_url, name: "", note: (r.description ?? "").trim().slice(0, 160) }));
    onPick(picked);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-medium">Add from GitHub</p>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-text">
            Close
          </button>
        </div>
        <div className="space-y-3 border-b border-line px-5 py-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              load(user);
            }}
          >
            <span className="grid place-items-center font-mono text-xs text-muted">github.com/</span>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="username" className={`${inputCls} !py-1.5`} aria-label="GitHub username" />
            <button type="submit" className={btnCls}>
              {loading ? "Loading…" : "Show"}
            </button>
          </form>
          {repos && repos.length > 8 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search repositories" className={`${inputCls} !py-1.5`} />}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {err && <p className="px-3 py-4 text-sm text-red-400">{err}</p>}
          {!err && !repos && !loading && <p className="px-3 py-6 text-center text-sm text-muted">Type a GitHub username and press Show.</p>}
          {loading && !repos && <p className="px-3 py-6 text-center text-sm text-muted">Loading repositories…</p>}
          {repos && rows.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">No public repositories found.</p>}
          {rows.map((r) => {
            const added = have.has(key(r.html_url));
            const on = sel.includes(r.html_url);
            return (
              <label key={r.html_url} className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ${added ? "opacity-50" : "hover:bg-surface-2"}`}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  disabled={added}
                  checked={added || on}
                  onChange={() => setSel(on ? sel.filter((x) => x !== r.html_url) : [...sel, r.html_url])}
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-mono text-sm">{r.name}</span>
                  {r.description && <span className="mt-0.5 block text-xs leading-snug text-muted">{r.description}</span>}
                  <span className="mt-0.5 block text-[11px] text-muted/70">
                    {[r.language, `updated ${r.pushed_at.slice(0, 7)}`, r.archived ? "archived" : "", added ? "already added" : ""].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="space-y-3 border-t border-line px-5 py-3">
          <div className="flex gap-2">
            <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Or paste any repository address" className={`${inputCls} !py-1.5`} aria-label="Repository address" />
            <button
              type="button"
              disabled={!pasted}
              className={btnCls}
              onClick={() => {
                if (!pasted) return;
                onPick([{ url: `https://github.com/${pasted.owner}/${pasted.repo}`, name: "", note: "" }]);
              }}
            >
              Add
            </button>
          </div>
          <p className="text-[11px] text-muted">Only public repositories are listed. A private one can be pasted, but visitors will not be able to open it.</p>
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-muted">{sel.length} selected</span>
            <button type="button" disabled={!sel.length} onClick={done} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40">
              Add {sel.length || ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- the Links tab ---------------- */

const field = (k: string) => projectShape.fields.find((f) => f.key === k)!;

export default function ProjectLinksTab({ all, i, path, githubUser }: { all: ProjectFamily[]; i: number; path: Path; githubUser: string }) {
  const { edit, toast } = useAdmin();
  const p = all[i];
  const [picker, setPicker] = useState(false);
  const have = new Set(p.repos.map((r) => r.url.toLowerCase().replace(/\/+$/, "")));

  return (
    <div className="space-y-8">
      <ShareLink key={p.slug} all={all} i={i} path={path} />

      <section>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">GitHub repositories</h3>
            <p className="text-xs text-muted">Shown as “Source code” on the project page. Add one or several.</p>
          </div>
          <button type="button" onClick={() => setPicker(true)} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink sm:py-1.5 sm:text-xs">
            + Add from GitHub
          </button>
        </div>
        <ListEditor field={field("repos")} path={path.concat("repos")} value={p.repos as unknown as Item[]} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Other links</h3>
        <ListEditor field={field("links")} path={path.concat("links")} value={p.links as unknown as Item[]} />
      </section>

      {picker && (
        <RepoPicker
          initialUser={githubUser}
          have={have}
          onClose={() => setPicker(false)}
          onPick={(picked) => {
            const fresh = picked.filter((r) => !have.has(r.url.toLowerCase().replace(/\/+$/, "")));
            if (fresh.length) edit(path.concat("repos"), (old) => [...((old as Item[]) ?? []), ...fresh], { step: true });
            setPicker(false);
            toast(fresh.length ? `Added ${fresh.length} repositor${fresh.length === 1 ? "y" : "ies"}. Add a short note to each if you like.` : "Those are already added.");
          }}
        />
      )}
    </div>
  );
}
