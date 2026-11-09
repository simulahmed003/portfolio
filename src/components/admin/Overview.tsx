"use client";
import type { SiteContent } from "@/lib/types";

type Go = (section: string, opts?: { project?: number; tab?: string }) => void;

function Stat({ value, label, onClick }: { value: number | string; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-line bg-surface/60 p-4 text-left transition hover:border-line-strong">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </button>
  );
}

export default function Overview({ data, goTo, newProject, newCertificate, savedAt }: { data: SiteContent; goTo: Go; newProject: () => void; newCertificate: () => void; savedAt: string }) {
  const live = data.projects.filter((p) => !p.hidden);
  const photos = new Set(data.projects.flatMap((p) => p.versions.flatMap((v) => v.images.map((i) => i.src)))).size;
  const checks: { text: string; go: () => void }[] = [];
  data.projects.forEach((p, i) => {
    if (p.hidden) return;
    const imgs = p.cover || p.versions.some((v) => v.images.length);
    if (!imgs) checks.push({ text: `“${p.title || "Untitled"}” has no photos yet.`, go: () => goTo("projects", { project: i }) });
    if (!p.tagline.trim()) checks.push({ text: `“${p.title || "Untitled"}” has no one-line description.`, go: () => goTo("projects", { project: i }) });
    if (!p.versions.filter((v) => !v.hidden).length) checks.push({ text: `“${p.title || "Untitled"}” has no visible version.`, go: () => goTo("projects", { project: i }) });
  });
  data.certificates.forEach((c) => {
    if (!c.hidden && !c.image) checks.push({ text: `Certificate “${c.title || "Untitled"}” has no image.`, go: () => goTo("recognition") });
  });
  if (!data.contact.cvUrl) checks.push({ text: "No CV uploaded yet, so there is no Download CV button.", go: () => goTo("contact") });
  if (!data.meta.description.trim()) checks.push({ text: "No description for Google and link previews.", go: () => goTo("profile") });
  const hidden = data.projects.length - live.length;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={live.length} label={`projects live${hidden ? ` · ${hidden} hidden` : ""}`} onClick={() => goTo("projects")} />
        <Stat value={photos} label="project photos" onClick={() => goTo("projects")} />
        <Stat value={data.certificates.filter((c) => !c.hidden).length} label="certificates" onClick={() => goTo("recognition")} />
        <Stat value={data.experience.filter((e) => !e.hidden).length} label="roles in Experience" onClick={() => goTo("experience")} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={newProject} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink">
            + New project
          </button>
          <button type="button" onClick={newCertificate} className="rounded-lg border border-line-strong px-4 py-2.5 text-sm hover:border-accent hover:text-accent">
            + Add certificate
          </button>
          <button type="button" onClick={() => goTo("profile")} className="rounded-lg border border-line-strong px-4 py-2.5 text-sm hover:border-accent hover:text-accent">
            Edit name, photo and headline
          </button>
          <button type="button" onClick={() => goTo("layout")} className="rounded-lg border border-line-strong px-4 py-2.5 text-sm hover:border-accent hover:text-accent">
            Reorder or hide sections
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">{checks.length ? `Worth fixing (${checks.length})` : "Everything looks complete"}</h2>
        {checks.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {checks.slice(0, 12).map((c, i) => (
              <li key={i}>
                <button type="button" onClick={c.go} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-surface-2">
                  <span>{c.text}</span>
                  <span className="shrink-0 text-xs text-accent">Fix →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-line bg-surface/60 p-5 text-sm leading-relaxed text-muted">
        <h2 className="mb-2 font-medium text-text">How editing works</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Changes stay in this browser until you press <span className="text-text">Save and publish</span>. The live site updates a few seconds later.</li>
          <li>Unsaved work is kept on this device if the page reloads, and Undo (Ctrl+Z) goes back step by step.</li>
          <li>Every save is kept in Backups and history, so you can bring back an earlier version at any time.</li>
          <li>● Live / ○ Hidden on any item shows or pauses it without deleting it. Hidden items are left out of the public site.</li>
          <li>Each project has its own link for your CV: tap the link icon next to it, or “Copy all links for CV” on the Projects page.</li>
        </ul>
        {savedAt && <p className="mt-3 text-xs">Last published {savedAt}.</p>}
      </section>
    </div>
  );
}
