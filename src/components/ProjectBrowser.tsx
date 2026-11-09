"use client";
import { useMemo, useState } from "react";
import type { Labels, ProjectFamily } from "@/lib/types";
import { ProjectTile } from "./ProjectCards";

// All projects page: filter by category and search, grouped by category when nothing is filtered.
export default function ProjectBrowser({ projects, labels }: { projects: ProjectFamily[]; labels: Labels }) {
  const cats = useMemo(() => Array.from(new Set(projects.map((p) => p.category || "Other"))), [projects]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = projects.filter(
    (p) =>
      (!cat || (p.category || "Other") === cat) &&
      (!query || [p.title, p.tagline, p.organisation, p.category, ...p.tags].join(" ").toLowerCase().includes(query)),
  );
  const grouped = !cat && !query;

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {cats.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group">
            {["", ...cats].map((k) => (
              <button
                key={k || "all"}
                onClick={() => setCat(k)}
                aria-pressed={cat === k}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === k ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-line-strong hover:text-text"}`}
              >
                {k || labels.filterAll}
              </button>
            ))}
          </div>
        )}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.searchProjects}
          aria-label={labels.searchProjects}
          className="w-full rounded-full border border-line bg-surface px-4 py-2 text-base outline-none transition placeholder:text-muted/60 focus:border-accent md:w-72 md:text-sm"
        />
      </div>
      {!list.length && <p className="py-16 text-center text-muted">{labels.noResults}</p>}
      {grouped
        ? cats.map((k) => (
            <section key={k} className="mb-14">
              <h2 className="mb-5 border-b border-line pb-3 font-mono text-xs uppercase tracking-wider text-accent">{k}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list
                  .filter((p) => (p.category || "Other") === k)
                  .map((p) => (
                    <ProjectTile key={p.slug} p={p} labels={labels} />
                  ))}
              </div>
            </section>
          ))
        : list.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <ProjectTile key={p.slug} p={p} labels={labels} />
              ))}
            </div>
          )}
    </div>
  );
}
