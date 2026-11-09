import "server-only";
import { defaultContent } from "@/content/default";
import type { SiteContent } from "./types";
import { CONTENT_TABLE, SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./supabase";

export const CONTENT_TAG = "site-content";

// Deep-merge saved content over defaults so new fields added in code always have a value.
function merge<T>(base: T, saved: unknown): T {
  if (saved === undefined || saved === null) return base;
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
  if (typeof base === "object" && base !== null && typeof saved === "object" && !Array.isArray(saved)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
      out[k] = k in out ? merge(out[k], v) : v;
    }
    return out as T;
  }
  return (typeof saved === typeof base ? saved : base) as T;
}

export async function getContent(): Promise<SiteContent> {
  if (!supabaseConfigured) return defaultContent;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${CONTENT_TABLE}?id=eq.main&select=data`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { tags: [CONTENT_TAG], revalidate: 300 },
    });
    if (!res.ok) return defaultContent;
    const rows = (await res.json()) as { data: unknown }[];
    if (!rows.length) return defaultContent;
    return merge(defaultContent, rows[0].data);
  } catch {
    return defaultContent;
  }
}

export function visibleProjects(c: SiteContent) {
  return c.projects.filter((p) => !p.hidden);
}
