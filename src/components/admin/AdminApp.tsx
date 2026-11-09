"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { SiteContent } from "@/lib/types";
import { browserClient, CONTENT_TABLE, MEDIA_BUCKET, supabaseConfigured } from "@/lib/supabase";
import FieldEditor, { type Json, type Uploader } from "./FieldEditor";

const SECTIONS: { id: string; label: string; keys: (keyof SiteContent)[]; help: string }[] = [
  { id: "hero", label: "Hero and SEO", keys: ["hero", "meta"], help: "Your name, headline, photo and the text search engines show." },
  { id: "stats", label: "Key numbers", keys: ["stats"], help: "The four numbers under the hero." },
  { id: "about", label: "About", keys: ["about"], help: "About text and the four capability cards." },
  { id: "projects", label: "Projects", keys: ["projectsSection", "projects"], help: "Each project is a family with versions. Open a project, then open a version to edit its text and images." },
  { id: "experience", label: "Experience", keys: ["experienceSection", "experience"], help: "Jobs and roles, newest first. Use the arrows to reorder." },
  { id: "skills", label: "Skills", keys: ["skills"], help: "Skill groups shown in the Toolkit section." },
  { id: "recognition", label: "Awards and certificates", keys: ["awards", "certifications"], help: "Awards and certificates." },
  { id: "leadership", label: "Leadership and education", keys: ["activitiesSection", "activities", "education"], help: "Workshops, communities, competitions and education." },
  { id: "contact", label: "Contact and CV", keys: ["contact"], help: "Contact details. Upload your CV PDF here to show a Download CV button." },
];

async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), "image/webp", 0.85));
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 text-2xl font-semibold">Supabase is not connected yet</h1>
      <p className="mt-4 text-muted">
        The site is showing its built-in content. To edit from here, set <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-accent">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel and redeploy. See README.md.
      </p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">Back to site</Link>
    </div>
  );
}

function Login({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async (mode: "in" | "up" | "reset") => {
    setBusy(true);
    setMsg("");
    const redirectTo = `${window.location.origin}/admin`;
    const r =
      mode === "in"
        ? await sb.auth.signInWithPassword({ email, password })
        : mode === "up"
          ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
          : await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (r.error) setMsg(r.error.message);
    else if (mode === "up") setMsg("Account created. If asked, confirm the email we sent you, then sign in.");
    else if (mode === "reset") setMsg("Password reset email sent.");
  };
  const input = "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent";
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={(e) => { e.preventDefault(); go("in"); }} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7">
        <p className="eyebrow">Portfolio admin</p>
        <h1 className="mt-2 text-xl font-semibold">Sign in</h1>
        <div className="mt-6 space-y-3">
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <button disabled={busy} className="mt-5 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-[#14100b] disabled:opacity-50">
          {busy ? "Please wait…" : "Sign in"}
        </button>
        <div className="mt-4 flex justify-between text-xs text-muted">
          <button type="button" onClick={() => go("up")} className="hover:text-text">First time? Create account</button>
          <button type="button" onClick={() => email && go("reset")} className="hover:text-text">Forgot password</button>
        </div>
        {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}
      </form>
    </div>
  );
}

export default function AdminApp({ defaults }: { defaults: SiteContent }) {
  const sb = useMemo(() => (supabaseConfigured ? browserClient() : null), []);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [section, setSection] = useState(SECTIONS[0].id);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sb || !session) return;
    sb.from(CONTENT_TABLE)
      .select("data, updated_at")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (error) setStatus(`Could not load: ${error.message}`);
        // Fill any fields missing from the saved copy with defaults
        const merged = row?.data ? { ...defaults, ...(row.data as SiteContent) } : defaults;
        setData(merged);
        setSaved(JSON.stringify(merged));
        if (row?.updated_at) setStatus(`Last saved ${new Date(row.updated_at).toLocaleString()}`);
        else if (!error) setStatus("Showing built-in content. Save once to store it in the database.");
      });
  }, [sb, session, defaults]);

  const dirty = data !== null && JSON.stringify(data) !== saved;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upload: Uploader = useCallback(
    async (file, kind) => {
      if (!sb) throw new Error("Not connected");
      const body = kind === "image" ? await compressImage(file) : file;
      const ext = kind === "image" && body !== file ? "webp" : (file.name.split(".").pop() ?? "bin").toLowerCase();
      const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "file";
      const path = `${kind === "image" ? "images" : "files"}/${Date.now()}-${base}.${ext}`;
      const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, body, { contentType: body.type || undefined, upsert: false });
      if (error) throw new Error(error.message);
      return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    },
    [sb],
  );

  const save = async () => {
    if (!sb || !data || !session) return;
    const slugs = data.projects.map((p) => p.slug);
    const bad = slugs.find((s, i) => !/^[a-z0-9-]+$/.test(s) || slugs.indexOf(s) !== i);
    if (bad !== undefined) {
      setStatus(`Fix project slug "${bad}": use lowercase letters, numbers and dashes, and keep each one unique.`);
      return;
    }
    setSaving(true);
    setStatus("Saving…");
    const { error } = await sb.from(CONTENT_TABLE).upsert({ id: "main", data, updated_at: new Date().toISOString() });
    if (error) {
      setSaving(false);
      setStatus(`Save failed: ${error.message}`);
      return;
    }
    const r = await fetch("/api/revalidate", { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } });
    setSaving(false);
    setSaved(JSON.stringify(data));
    setStatus(r.ok ? `Saved and published ${new Date().toLocaleTimeString()}` : "Saved. The live site will update within 5 minutes.");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  if (!sb) return <SetupNotice />;
  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;
  if (!session) return <Login sb={sb} />;
  if (!data) return <div className="grid min-h-screen place-items-center text-muted">Loading content…</div>;

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <p className="font-medium">Portfolio admin</p>
          <span className="hidden truncate text-xs text-muted sm:inline">{status}</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-text">View site ↗</Link>
            <button onClick={save} disabled={!dirty || saving} className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-[#14100b] disabled:opacity-40">
              {saving ? "Saving…" : dirty ? "Save and publish" : "Saved"}
            </button>
          </div>
          <span className="w-full truncate text-xs text-muted sm:hidden">{status}</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${section === s.id ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 hidden space-y-2 border-t border-line pt-4 text-xs md:block">
            <button onClick={exportJson} className="block text-muted hover:text-text">Download backup (JSON)</button>
            <button
              onClick={() => confirm("Load the original built-in content into the editor? Nothing is saved until you press Save.") && setData(defaults)}
              className="block text-muted hover:text-text"
            >
              Load original content
            </button>
            <button onClick={() => sb.auth.signOut()} className="block text-muted hover:text-text">Sign out</button>
          </div>
        </aside>
        <main>
          <h1 className="text-2xl font-semibold tracking-tight">{current.label}</h1>
          <p className="mt-1 text-sm text-muted">{current.help}</p>
          <div className="mt-6 space-y-6">
            {current.keys.map((k) => (
              <section key={k} className="rounded-2xl border border-line bg-surface/60 p-5">
                <FieldEditor
                  k={k}
                  value={data[k] as unknown as Json}
                  sample={defaults[k] as unknown as Json}
                  upload={upload}
                  onChange={(v) => setData({ ...data, [k]: v } as SiteContent)}
                />
              </section>
            ))}
          </div>
          <div className="mt-8 flex gap-4 border-t border-line pt-4 text-xs md:hidden">
            <button onClick={exportJson} className="text-muted">Backup</button>
            <button onClick={() => sb.auth.signOut()} className="text-muted">Sign out</button>
          </div>
        </main>
      </div>
    </div>
  );
}
