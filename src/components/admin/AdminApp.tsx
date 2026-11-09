"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { SiteContent } from "@/lib/types";
import { certificateShape, githubUserFrom, siteFields, type Field, type Item } from "@/lib/schema";
import { fixSlugs, newItem, normalizeContent, publicContent } from "@/lib/normalize";
import { ADMIN_ROW, browserClient, CONTENT_TABLE, HISTORY_KEEP, HISTORY_PREFIX, PUBLIC_ROW, supabaseConfigured } from "@/lib/supabase";
import { AdminContext, setIn, type AdminCtx, type Path } from "./context";
import { FieldView } from "./fields";
import ProjectsEditor, { createProject } from "./ProjectsEditor";
import LayoutEditor from "./LayoutEditor";
import Overview from "./Overview";
import HistoryPanel from "./HistoryPanel";
import { compressImage, isPdf, pdfFirstPage, uploadBlob } from "./upload";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();
const DRAFT_KEY = "portfolio-admin-draft-v2";
const DEMO_KEY = "portfolio-admin-demo-content";

type Block = { key: keyof SiteContent; fold?: string };
type Section = { id: string; label: string; help?: string; blocks?: Block[] };

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  {
    id: "projects",
    label: "Projects",
    help: "Tap a project to edit its details, photos and versions. ● Live / ○ Hidden shows or pauses it; ★ makes it a large featured card.",
    blocks: [{ key: "projectsSection", fold: "Section heading and text" }],
  },
  {
    id: "recognition",
    label: "Certificates and awards",
    help: "Add a certificate with a photo, screenshot or PDF of it. Visitors can open it full screen.",
    blocks: [{ key: "certificates" }, { key: "awards" }, { key: "recognitionSection", fold: "Section heading and text" }],
  },
  { id: "experience", label: "Experience", help: "Jobs and roles, newest first.", blocks: [{ key: "experience" }, { key: "experienceSection", fold: "Section heading and text" }] },
  { id: "profile", label: "Name, photo and SEO", help: "The top of the home page, how the site looks in Google and link previews, and the accent colour.", blocks: [{ key: "hero" }, { key: "meta" }, { key: "theme" }] },
  { id: "stats", label: "Key numbers", help: "The row of numbers under the top of the page.", blocks: [{ key: "stats" }] },
  { id: "about", label: "About", blocks: [{ key: "about" }] },
  { id: "skills", label: "Skills", blocks: [{ key: "skills" }, { key: "skillsSection", fold: "Section heading and text" }] },
  {
    id: "leadership",
    label: "Leadership and education",
    blocks: [{ key: "activities" }, { key: "education" }, { key: "activitiesSection", fold: "Section heading and text" }],
  },
  { id: "contact", label: "Contact, CV and footer", help: "Upload your CV here to show a Download CV button.", blocks: [{ key: "contact" }, { key: "footer" }] },
  { id: "layout", label: "Sections and menu", help: "Reorder, hide or rename the sections of the home page." },
  { id: "labels", label: "Words and labels", help: "Every small piece of text on the site: buttons, links and page titles.", blocks: [{ key: "labels" }] },
  { id: "history", label: "Backups and history", help: "Bring back an earlier version, download a backup, or clean up unused uploads." },
];

const fieldFor = (key: string) => siteFields.find((f) => f.key === key) as Field;

function collectImages(fields: Field[], value: unknown, out: Set<string>) {
  if (!value || typeof value !== "object") return;
  const v = value as Item;
  for (const f of fields) {
    const x = v[f.key];
    if (f.kind === "image" && typeof x === "string" && x) out.add(x);
    else if (f.kind === "gallery" && Array.isArray(x)) x.forEach((im) => im?.src && out.add(im.src));
    else if (f.kind === "group") collectImages(f.fields ?? [], x, out);
    else if (f.kind === "list" && Array.isArray(x)) x.forEach((it) => collectImages(f.item!.fields, it, out));
  }
}

const isDemo = () => process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

/* ---------------- sign-in screens ---------------- */

const authInput = "w-full rounded-lg border border-line bg-bg px-3 py-3 text-base outline-none focus:border-accent sm:text-sm";

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7">
        <p className="eyebrow">Portfolio admin</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Login({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async (mode: "in" | "up" | "reset") => {
    if (!email) return setMsg({ text: "Enter your email first.", bad: true });
    if (mode !== "reset" && password.length < 8) return setMsg({ text: "The password needs at least 8 characters.", bad: true });
    setBusy(true);
    setMsg(null);
    const redirectTo = `${window.location.origin}/admin`;
    const r =
      mode === "in"
        ? await sb.auth.signInWithPassword({ email, password })
        : mode === "up"
          ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
          : await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (r.error) setMsg({ text: /invalid login/i.test(r.error.message) ? "Wrong email or password." : r.error.message, bad: true });
    else if (mode === "up") setMsg({ text: "Account created. If an email arrives, tap its link, then sign in here." });
    else if (mode === "reset") setMsg({ text: "Check your email for a link to choose a new password." });
  };
  return (
    <AuthCard title="Sign in">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go("in");
        }}
      >
        <div className="mt-6 space-y-3">
          <input className={authInput} type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
            <input
              className={`${authInput} pr-16`}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button disabled={busy} className="mt-5 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">
          {busy ? "Please wait…" : "Sign in"}
        </button>
        <div className="mt-4 flex justify-between gap-3 text-xs text-muted">
          <button type="button" onClick={() => go("reset")} className="hover:text-text">
            Forgot password?
          </button>
          <button type="button" onClick={() => go("up")} className="hover:text-text">
            First time? Create account
          </button>
        </div>
        {msg && <p className={`mt-4 text-sm ${msg.bad ? "text-red-400" : "text-accent"}`}>{msg.text}</p>}
      </form>
    </AuthCard>
  );
}

function NewPassword({ sb, onDone, title = "Choose a new password" }: { sb: SupabaseClient; onDone: () => void; title?: string }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setMsg("At least 8 characters.");
        setBusy(true);
        const { error } = await sb.auth.updateUser({ password: pw });
        setBusy(false);
        if (error) setMsg(error.message);
        else onDone();
      }}
    >
      <p className="mt-2 text-sm text-muted">{title}</p>
      <input className={`${authInput} mt-4`} type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
      <button disabled={busy} className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">
        {busy ? "Saving…" : "Save password"}
      </button>
      {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
    </form>
  );
}

/* ---------------- main ---------------- */

type Hist = { past: SiteContent[]; present: SiteContent; future: SiteContent[] };
type ToastItem = { id: number; msg: string; action?: { label: string; run: () => void } };

export default function AdminApp({ defaults }: { defaults: SiteContent }) {
  const [demo] = useState(isDemo);
  const sb = useMemo(() => (supabaseConfigured ? browserClient() : null), []);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [hist, setHist] = useState<Hist | null>(null);
  const [savedJson, setSavedJson] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [status, setStatus] = useState<{ text: string; bad?: boolean }>({ text: "" });
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("overview");
  const [projectOpen, setProjectOpen] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [draftOffer, setDraftOffer] = useState<{ at: number; data: SiteContent } | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const baseAt = useRef<string | null>(null);
  const last = useRef<{ key: string; at: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  /* auth */
  useEffect(() => {
    if (demo) {
      setReady(true);
      return;
    }
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb, demo]);

  const email = session?.user.email?.toLowerCase() ?? "";
  const allowed = demo || (!!session && (!ADMIN_EMAIL || email === ADMIN_EMAIL));

  /* load */
  const startWith = useCallback((content: SiteContent, at: string | null) => {
    baseAt.current = at;
    const json = JSON.stringify(content);
    setSavedJson(json);
    setSavedAt(at ? new Date(at).toLocaleString() : "");
    setHist({ past: [], present: content, future: [] });
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { at: number; data: unknown };
        const draft = normalizeContent(d.data, defaults);
        if (JSON.stringify(draft) !== json) setDraftOffer({ at: d.at, data: draft });
        else localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* storage unavailable */
    }
  }, [defaults]);

  useEffect(() => {
    if (!ready || !allowed || hist) return;
    if (demo) {
      let saved: unknown = null;
      try {
        saved = JSON.parse(localStorage.getItem(DEMO_KEY) ?? "null");
      } catch {}
      startWith(saved ? normalizeContent(saved, defaults) : defaults, null);
      setStatus({ text: "Demo mode: saves stay in this browser." });
      return;
    }
    sb!
      .from(CONTENT_TABLE)
      .select("id, data, updated_at")
      .in("id", [ADMIN_ROW, PUBLIC_ROW])
      .then(({ data: rows, error }) => {
        if (error) setStatus({ text: `Could not load the saved content (${error.message}). Showing the built-in content.`, bad: true });
        const row = rows?.find((r) => r.id === ADMIN_ROW) ?? rows?.find((r) => r.id === PUBLIC_ROW);
        startWith(row ? normalizeContent(row.data, defaults) : defaults, row?.updated_at ?? null);
        if (!row && !error) setStatus({ text: "Showing the built-in content. Save once to store it." });
      });
  }, [ready, allowed, hist, demo, sb, defaults, startWith]);

  const data = hist?.present ?? null;
  const json = useMemo(() => (data ? JSON.stringify(data) : ""), [data]);
  const dirty = !!data && json !== savedJson;

  /* editing with undo */
  const edit = useCallback<AdminCtx["edit"]>((path, fn, opts) => {
    const key = path.join(".");
    const now = Date.now();
    const merge = !opts?.step && last.current?.key === key && now - last.current.at < 1500;
    last.current = opts?.step ? null : { key, at: now };
    setHist((h) => {
      if (!h) return h;
      const next = setIn(h.present, path, fn) as SiteContent;
      if (next === h.present) return h;
      return merge ? { ...h, present: next, future: [] } : { past: [...h.past.slice(-80), h.present], present: next, future: [] };
    });
  }, []);
  const set = useCallback<AdminCtx["set"]>((path, v, opts) => edit(path, () => v, opts), [edit]);
  const undo = useCallback(() => {
    last.current = null;
    setHist((h) => (h && h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  }, []);
  const redo = useCallback(() => {
    last.current = null;
    setHist((h) => (h && h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);

  const toast = useCallback<AdminCtx["toast"]>((msg, action) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 7000 : 4500);
  }, []);

  const replaceAll = useCallback(
    (c: SiteContent, note: string) => {
      last.current = null;
      setHist((h) => (h ? { past: [...h.past.slice(-80), h.present], present: c, future: [] } : { past: [], present: c, future: [] }));
      setProjectOpen(null);
      toast(note);
    },
    [toast],
  );

  /* uploads */
  const uploadImage = useCallback<AdminCtx["uploadImage"]>(
    async (file, onPdf) => {
      const pdf = isPdf(file);
      const blob = pdf ? await pdfFirstPage(file) : await compressImage(file);
      if (demo || !sb) return URL.createObjectURL(blob);
      const [img, pdfUrl] = await Promise.all([uploadBlob(sb, blob, file.name, "image"), pdf && onPdf ? uploadBlob(sb, file, file.name, "file") : Promise.resolve("")]);
      if (pdfUrl && onPdf) onPdf(pdfUrl);
      return img;
    },
    [sb, demo],
  );
  const uploadFile = useCallback<AdminCtx["uploadFile"]>(async (file) => (demo || !sb ? URL.createObjectURL(file) : uploadBlob(sb, file, file.name, "file")), [sb, demo]);

  const library = useMemo(() => {
    const s = new Set<string>();
    if (data) collectImages(siteFields, data, s);
    return Array.from(s);
  }, [data]);
  const categories = useMemo(() => Array.from(new Set((data?.projects ?? []).map((p) => p.category).filter(Boolean))), [data]);

  /* keep unsaved work on this device */
  useEffect(() => {
    if (!data || draftOffer) return;
    const t = setTimeout(() => {
      try {
        if (dirty) localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), data }));
        else localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [data, dirty, draftOffer]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* save */
  const save = useCallback(async () => {
    if (!hist || saving) return;
    let content = hist.present;
    const fixed = fixSlugs(content.projects);
    if (fixed !== content.projects) content = { ...content, projects: fixed };
    content = normalizeContent(content, defaults);
    if (JSON.stringify(content) !== JSON.stringify(hist.present)) setHist((h) => (h ? { ...h, present: content } : h));
    const doneJson = JSON.stringify(content);

    if (demo || !sb) {
      try {
        localStorage.setItem(DEMO_KEY, doneJson);
      } catch {}
      setSavedJson(doneJson);
      setSavedAt(new Date().toLocaleString());
      setStatus({ text: `Saved in demo mode ${new Date().toLocaleTimeString()}` });
      return;
    }

    setSaving(true);
    setStatus({ text: "Saving…" });
    const { data: cur } = await sb.from(CONTENT_TABLE).select("updated_at").eq("id", ADMIN_ROW).maybeSingle();
    if (cur?.updated_at && cur.updated_at !== baseAt.current) {
      const ok = confirm(
        `This content was saved from another device or tab at ${new Date(cur.updated_at).toLocaleString()}, after you opened it. Save anyway and replace that version? (It stays in Backups and history.)`,
      );
      if (!ok) {
        setSaving(false);
        setStatus({ text: "Not saved. Reload the page to get the newer version." , bad: true });
        return;
      }
    }
    const now = new Date().toISOString();
    const { error } = await sb.from(CONTENT_TABLE).upsert([
      { id: ADMIN_ROW, data: content, updated_at: now },
      { id: PUBLIC_ROW, data: publicContent(content), updated_at: now },
      { id: `${HISTORY_PREFIX}${now}`, data: content, updated_at: now },
    ]);
    if (error) {
      setSaving(false);
      const text = /row-level security/i.test(error.message) ? `This account can't publish. Sign in as ${ADMIN_EMAIL || "the admin"}.` : `Save failed: ${error.message}`;
      setStatus({ text, bad: true });
      toast(text);
      return;
    }
    baseAt.current = now;
    setSavedJson(doneJson);
    setSavedAt(new Date(now).toLocaleString());
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    // keep the last HISTORY_KEEP saves
    const { data: old } = await sb.from(CONTENT_TABLE).select("id").like("id", `${HISTORY_PREFIX}%`).order("id", { ascending: false }).range(HISTORY_KEEP, HISTORY_KEEP + 500);
    if (old?.length) await sb.from(CONTENT_TABLE).delete().in("id", old.map((r) => r.id));
    const token = (await sb.auth.getSession()).data.session?.access_token;
    const r = await fetch("/api/revalidate", { method: "POST", headers: { authorization: `Bearer ${token}` } }).catch(() => null);
    setSaving(false);
    setStatus({ text: r?.ok ? `Published ${new Date().toLocaleTimeString()}` : "Saved. The live site updates within 5 minutes." });
    toast(r?.ok ? "Saved and published." : "Saved. The live site updates within 5 minutes.");
  }, [hist, saving, defaults, demo, sb, toast]);

  /* keyboard */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) save();
      } else if (!typing && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!typing && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [dirty, save, undo, redo]);

  const goTo = useCallback((id: string, opts?: { project?: number }) => {
    setSection(id);
    setProjectOpen(opts?.project ?? null);
    window.scrollTo({ top: 0 });
  }, []);

  const ctx = useMemo<AdminCtx>(() => ({ edit, set, undo, uploadImage, uploadFile, library, categories, toast }), [edit, set, undo, uploadImage, uploadFile, library, categories, toast]);

  /* ---------- screens before the editor ---------- */
  if (!sb && !demo)
    return (
      <AuthCard title="Supabase is not connected">
        <p className="mt-4 text-sm text-muted">
          The site is showing its built-in content. Set <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-accent">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and redeploy (see
          README.md).
        </p>
      </AuthCard>
    );
  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;
  if (recovery && sb)
    return (
      <AuthCard title="New password">
        <NewPassword
          sb={sb}
          onDone={() => {
            setRecovery(false);
            toast("Password changed.");
          }}
        />
      </AuthCard>
    );
  if (!session && !demo) return <Login sb={sb!} />;
  if (!allowed)
    return (
      <AuthCard title="This account can't edit the site">
        <p className="mt-4 text-sm text-muted">
          You are signed in as <span className="text-text">{session?.user.email}</span>. Only {ADMIN_EMAIL} can edit.
        </p>
        <button onClick={() => sb!.auth.signOut()} className="mt-5 w-full rounded-lg border border-line-strong py-2.5 text-sm">
          Sign out
        </button>
      </AuthCard>
    );
  if (!data) return <div className="grid min-h-screen place-items-center text-muted">Loading content…</div>;

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const newProject = () => {
    createProject(edit);
    goTo("projects", { project: 0 });
  };
  const newCertificate = () => {
    edit(["certificates"], (old) => [newItem(certificateShape), ...((old as Item[]) ?? [])], { step: true });
    goTo("recognition");
    toast("New certificate added at the top. Open it to fill it in.");
  };

  const renderBlock = (b: Block) => {
    const f = fieldFor(b.key);
    const view = <FieldView field={f} path={[b.key] as Path} value={data[b.key]} />;
    return b.fold ? (
      <details key={b.key} className="rounded-xl border border-line bg-surface/40 p-4">
        <summary className="cursor-pointer select-none text-sm text-muted hover:text-text">{b.fold}</summary>
        <div className="mt-4">{view}</div>
      </details>
    ) : (
      <section key={b.key}>{view}</section>
    );
  };

  return (
    <AdminContext.Provider value={ctx}>
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 h-14 border-b border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex h-full max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-5">
            <p className="hidden font-medium sm:block">Portfolio admin</p>
            <span className={`hidden min-w-0 truncate text-xs lg:block ${status.bad ? "text-red-400" : "text-muted"}`}>{dirty ? "Unsaved changes" : status.text}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button onClick={undo} disabled={!hist?.past.length} title="Undo (Ctrl+Z)" aria-label="Undo" className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30">
                ↶
              </button>
              <button onClick={redo} disabled={!hist?.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo" className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30">
                ↷
              </button>
              <Link href="/" target="_blank" className="rounded-md px-2 py-1.5 text-sm text-muted hover:text-text sm:px-3">
                Site ↗
              </Link>
              <button onClick={save} disabled={!dirty || saving} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40 sm:px-4">
                {saving ? "Saving…" : dirty ? (
                  <>
                    Save<span className="hidden sm:inline"> and publish</span>
                  </>
                ) : (
                  "Saved"
                )}
              </button>
            </div>
          </div>
        </header>

        {/* phones: section picker */}
        <div className="sticky top-14 z-30 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden">
          <select
            aria-label="Section"
            value={section}
            onChange={(e) => goTo(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-text outline-none focus:border-accent"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className={`mt-1 h-4 truncate text-[11px] leading-4 ${status.bad ? "text-red-400" : "text-muted"}`}>{dirty ? "Unsaved changes" : status.text}</p>
        </div>

        {draftOffer && (
          <div className="mx-auto mt-4 max-w-6xl px-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/50 bg-accent-soft px-4 py-3 text-sm">
              <span className="flex-1">You have unsaved changes from {new Date(draftOffer.at).toLocaleString()} on this device.</span>
              <button
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
                onClick={() => {
                  replaceAll(draftOffer.data, "Unsaved changes restored. Press Save and publish when ready.");
                  setDraftOffer(null);
                }}
              >
                Restore them
              </button>
              <button
                className="text-xs text-muted hover:text-text"
                onClick={() => {
                  try {
                    localStorage.removeItem(DRAFT_KEY);
                  } catch {}
                  setDraftOffer(null);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-6xl gap-8 px-3 py-6 sm:px-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden md:sticky md:top-20 md:block md:self-start">
            <nav className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${section === s.id ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs">
              {email && <p className="truncate text-muted/70">{email}</p>}
              {!demo && (
                <button onClick={() => setPwOpen(true)} className="block text-muted hover:text-text">
                  Change password
                </button>
              )}
              {!demo && (
                <button onClick={() => (!dirty || confirm("Sign out? Unsaved changes stay on this device.")) && sb!.auth.signOut()} className="block text-muted hover:text-text">
                  Sign out
                </button>
              )}
            </div>
          </aside>

          <main ref={mainRef} className="min-w-0">
            {!(section === "projects" && projectOpen !== null) && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">{current.label}</h1>
                {current.help && <p className="mt-1 text-sm text-muted">{current.help}</p>}
              </>
            )}
            <div className="mt-6 space-y-8">
              {section === "overview" && <Overview data={data} goTo={goTo} newProject={newProject} newCertificate={newCertificate} savedAt={savedAt} />}
              {section === "projects" && <ProjectsEditor value={data.projects} open={projectOpen} onOpen={setProjectOpen} githubUser={githubUserFrom(data.contact.links)} />}
              {section === "layout" && <LayoutEditor value={data.layout} goTo={goTo} />}
              {section === "history" && <HistoryPanel sb={demo ? null : sb} data={data} defaults={defaults} replaceAll={replaceAll} />}
              {current.blocks && !(section === "projects" && projectOpen !== null) && current.blocks.map(renderBlock)}
            </div>
            <div className="mt-12 flex gap-4 border-t border-line pt-4 text-xs text-muted md:hidden">
              {!demo && <button onClick={() => setPwOpen(true)}>Change password</button>}
              {!demo && <button onClick={() => (!dirty || confirm("Sign out? Unsaved changes stay on this device.")) && sb!.auth.signOut()}>Sign out</button>}
            </div>
          </main>
        </div>

        {pwOpen && sb && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-5" onClick={() => setPwOpen(false)}>
            <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">Change password</h2>
              <NewPassword
                sb={sb}
                title={`For ${email}`}
                onDone={() => {
                  setPwOpen(false);
                  toast("Password changed.");
                }}
              />
            </div>
          </div>
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div key={t.id} role="status" className="pointer-events-auto flex max-w-md items-center gap-4 rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm shadow-2xl">
              <span>{t.msg}</span>
              {t.action && (
                <button
                  className="shrink-0 font-semibold text-accent"
                  onClick={() => {
                    t.action!.run();
                    setToasts((x) => x.filter((y) => y.id !== t.id));
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminContext.Provider>
  );
}
