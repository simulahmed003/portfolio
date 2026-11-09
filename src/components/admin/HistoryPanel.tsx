"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SiteContent } from "@/lib/types";
import { normalizeContent } from "@/lib/normalize";
import { CONTENT_TABLE, HISTORY_PREFIX, MEDIA_BUCKET } from "@/lib/supabase";
import { useAdmin } from "./context";
import { btnCls } from "./ui";

type Row = { id: string; updated_at: string };

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function HistoryPanel({
  sb,
  data,
  defaults,
  replaceAll,
}: {
  sb: SupabaseClient | null;
  data: SiteContent;
  defaults: SiteContent;
  replaceAll: (c: SiteContent, note: string) => void;
}) {
  const { toast } = useAdmin();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [orphans, setOrphans] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!sb) return setRows([]);
    const { data: r, error } = await sb.from(CONTENT_TABLE).select("id, updated_at").like("id", `${HISTORY_PREFIX}%`).order("id", { ascending: false }).limit(60);
    if (error) setErr(error.message);
    setRows((r as Row[]) ?? []);
  }, [sb]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = async (row: Row) => {
    if (!sb) return;
    setBusy(row.id);
    const { data: r, error } = await sb.from(CONTENT_TABLE).select("data").eq("id", row.id).maybeSingle();
    setBusy("");
    if (error || !r) return toast(`Could not load that version: ${error?.message ?? "not found"}`);
    replaceAll(normalizeContent(r.data, defaults), `Loaded the version from ${when(row.updated_at)}. Press Save and publish to make it live.`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text());
      replaceAll(normalizeContent(parsed, defaults), `Loaded ${f.name}. Press Save and publish to make it live.`);
    } catch {
      toast("That file is not a valid backup.");
    }
  };

  // Uploaded files that nothing points to any more (not the current content, not any saved version).
  const findOrphans = async () => {
    if (!sb) return;
    setBusy("scan");
    setOrphans(null);
    try {
      const bucket = sb.storage.from(MEDIA_BUCKET);
      const paths: string[] = [];
      for (const top of ["images", "files"]) {
        const { data: dirs, error } = await bucket.list(top, { limit: 1000 });
        if (error) throw error;
        for (const d of dirs ?? []) {
          if (d.id) {
            paths.push(`${top}/${d.name}`); // a file directly in the folder (older uploads)
            continue;
          }
          const { data: files, error: e2 } = await bucket.list(`${top}/${d.name}`, { limit: 1000 });
          if (e2) throw e2;
          for (const f of files ?? []) if (f.id) paths.push(`${top}/${d.name}/${f.name}`);
        }
      }
      const { data: all, error } = await sb.from(CONTENT_TABLE).select("data");
      if (error) throw error;
      const used = JSON.stringify(all) + JSON.stringify(data);
      setOrphans(paths.filter((p) => !used.includes(p)));
    } catch (e) {
      toast(`Could not scan uploads: ${e instanceof Error ? e.message : String(e)}. Run the latest supabase/schema.sql to allow it.`);
    } finally {
      setBusy("");
    }
  };

  const removeOrphans = async () => {
    if (!sb || !orphans?.length) return;
    if (!confirm(`Delete ${orphans.length} unused file${orphans.length === 1 ? "" : "s"} from storage? This cannot be undone.`)) return;
    setBusy("delete");
    const { error } = await sb.storage.from(MEDIA_BUCKET).remove(orphans);
    setBusy("");
    if (error) return toast(`Delete failed: ${error.message}`);
    toast(`Deleted ${orphans.length} unused files.`);
    setOrphans([]);
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-1 font-medium">Saved versions</h2>
        <p className="mb-4 text-sm text-muted">Every Save and publish is kept here (the last 30). Loading one puts it in the editor; nothing changes on the site until you save again.</p>
        {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
        {rows === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">No saved versions yet. They appear after your first save.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {when(r.updated_at)}
                  {i === 0 && <span className="ml-2 rounded-full border border-green/50 px-2 py-0.5 text-[11px] text-green">live now</span>}
                </span>
                <button type="button" disabled={!!busy} onClick={() => restore(r)} className={btnCls}>
                  {busy === r.id ? "Loading…" : "Load into editor"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-medium">Backup file</h2>
        <p className="mb-4 text-sm text-muted">Download everything as one file to keep on your computer, or load a backup file back in.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} className={btnCls}>
            Download backup
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnCls}>
            Load backup file…
          </button>
          <button
            type="button"
            onClick={() => confirm("Load the original built-in content into the editor? Nothing changes on the site until you save.") && replaceAll(defaults, "Loaded the original content. Undo brings your version back.")}
            className={btnCls}
          >
            Load original content
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) importJson(f);
          }}
        />
      </section>

      {sb && (
        <section>
          <h2 className="mb-1 font-medium">Storage clean-up</h2>
          <p className="mb-4 text-sm text-muted">Removing a photo only takes it off the site. This finds uploaded files that no version uses any more, so you can delete them and free space.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!!busy} onClick={findOrphans} className={btnCls}>
              {busy === "scan" ? "Scanning…" : "Find unused files"}
            </button>
            {orphans && (
              <span className="text-sm text-muted">
                {orphans.length ? `${orphans.length} unused file${orphans.length === 1 ? "" : "s"} found.` : "Nothing to clean up."}
              </span>
            )}
            {!!orphans?.length && (
              <button type="button" disabled={!!busy} onClick={removeOrphans} className={`${btnCls} hover:!border-red-400 hover:!text-red-400`}>
                {busy === "delete" ? "Deleting…" : "Delete them"}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
