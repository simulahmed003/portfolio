import { SECTION_IDS, type SiteContent } from "./types";
import { siteFields, type Field, type Item, type ItemShape } from "./schema";

// Repairs any JSON into the exact shape the site expects, using the schema.
// - A missing value takes the fallback (the built-in content) or the field's blank default.
// - A value of the wrong type is replaced by the blank default, never passed through.
// - List items that are not objects, and photos without an address, are dropped.

const isObj = (v: unknown): v is Item => typeof v === "object" && v !== null && !Array.isArray(v);
const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function blankValue(f: Field): unknown {
  if (f.default !== undefined) return clone(f.default);
  switch (f.kind) {
    case "toggle":
      return false;
    case "number":
      return 0;
    case "tags":
    case "lines":
    case "gallery":
    case "list":
      return [];
    case "group":
      return blankObject(f.fields ?? []);
    default:
      return "";
  }
}

export function blankObject(fields: Field[]): Item {
  const o: Item = {};
  for (const x of fields) o[x.key] = blankValue(x);
  return o;
}

export function newItem(shape: ItemShape): Item {
  return normalizeObject(shape.fields, { ...blankObject(shape.fields), ...(shape.fresh ? shape.fresh() : {}) });
}

function toImg(v: unknown) {
  if (typeof v === "string") return v.trim() ? { src: v.trim(), caption: "", alt: "" } : null;
  if (!isObj(v) || typeof v.src !== "string" || !v.src.trim()) return null;
  return {
    src: v.src.trim(),
    caption: typeof v.caption === "string" ? v.caption : "",
    alt: typeof v.alt === "string" ? v.alt : "",
  };
}

export function normalizeField(f: Field, v: unknown, fallback?: unknown): unknown {
  if (v === undefined || v === null) return fallback === undefined || fallback === null ? blankValue(f) : normalizeField(f, fallback);
  switch (f.kind) {
    case "number": {
      const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
      return Number.isFinite(n) ? n : blankValue(f);
    }
    case "toggle":
      return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : blankValue(f);
    case "tags":
    case "lines":
      if (typeof v === "string") return v.trim() ? [v] : [];
      return Array.isArray(v) ? v.filter((x) => typeof x === "string" || typeof x === "number").map(String) : [];
    case "gallery":
      return Array.isArray(v) ? v.map(toImg).filter((x) => x !== null) : [];
    case "group":
      return normalizeObject(f.fields ?? [], v, fallback);
    case "list":
      return Array.isArray(v) ? v.filter(isObj).map((x) => normalizeObject(f.item!.fields, x)) : [];
    default:
      return typeof v === "string" ? v : typeof v === "number" ? String(v) : blankValue(f);
  }
}

export function normalizeObject(fields: Field[], v: unknown, fallback?: unknown): Item {
  const src = isObj(v) ? v : undefined;
  const fb = isObj(fallback) ? fallback : undefined;
  if (!src) return fb ? normalizeObject(fields, fb) : blankObject(fields);
  const out: Item = {};
  for (const x of fields) out[x.key] = normalizeField(x, src[x.key], fb?.[x.key]);
  return out;
}

// Every section appears once in the layout; sections added to the code later are appended.
function fixLayout(c: SiteContent, defaults?: SiteContent): SiteContent {
  const known = new Set<string>(SECTION_IDS);
  const seen = new Set<string>();
  const layout = c.layout.filter((l) => known.has(l.id) && !seen.has(l.id) && seen.add(l.id));
  for (const id of SECTION_IDS) {
    if (!seen.has(id)) layout.push(defaults?.layout.find((l) => l.id === id) ?? { id, show: true, nav: "" });
  }
  return { ...c, layout };
}

export function normalizeContent(saved: unknown, defaults?: SiteContent): SiteContent {
  const c = normalizeObject(siteFields, saved, defaults) as unknown as SiteContent;
  return fixLayout(c, defaults);
}

export function slugify(t: string) {
  return t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Gives every project a unique, valid web address. Addresses that are already valid and unique are never
// changed (they may be printed on a CV); only empty, invalid or duplicate ones are filled in. A new address
// also avoids the earlier addresses of other projects, because those still redirect to their project.
// Returns a new array only when something changed.
export function fixSlugs<T extends { slug: string; title: string; oldSlugs?: string[] }>(projects: T[]): T[] {
  const used = new Set<string>();
  const keep = projects.map((p) => {
    const ok = !!p.slug && slugify(p.slug) === p.slug && !used.has(p.slug);
    if (ok) used.add(p.slug);
    return ok;
  });
  for (const p of projects) for (const s of p.oldSlugs ?? []) used.add(s);
  let changed = false;
  const out = projects.map((p, i) => {
    if (keep[i]) return p;
    const base = slugify(p.slug || p.title) || `project-${i + 1}`;
    let s = base;
    for (let n = 2; used.has(s); n++) s = `${base}-${n}`;
    used.add(s);
    changed = true;
    return { ...p, slug: s };
  });
  return changed ? out : projects;
}

const shown = <T extends { hidden: boolean }>(xs: T[]) => xs.filter((x) => !x.hidden);

// What visitors may see: hidden items removed everywhere, and nothing that would render as an empty card.
export function publicContent(c: SiteContent): SiteContent {
  return {
    ...c,
    projects: shown(c.projects)
      .filter((p) => p.title.trim() && p.slug.trim())
      .map((p) => ({ ...p, versions: shown(p.versions) })),
    experience: shown(c.experience).filter((e) => e.role.trim() || e.organisation.trim()),
    awards: shown(c.awards).filter((a) => a.title.trim()),
    certificates: shown(c.certificates).filter((x) => x.title.trim()),
    activities: shown(c.activities).filter((a) => a.title.trim()),
    education: shown(c.education).filter((e) => e.school.trim()),
    skills: shown(c.skills).filter((s) => s.group.trim() || s.items.length),
    stats: c.stats.filter((s) => s.value.trim() || s.label.trim()),
  };
}
