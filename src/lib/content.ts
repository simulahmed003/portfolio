import "server-only";
import { cache } from "react";
import { defaultContent } from "@/content/default";
import type { SiteContent } from "./types";
import { normalizeContent, publicContent } from "./normalize";
import { CONTENT_TABLE, PUBLIC_ROW, SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./supabase";

export const CONTENT_TAG = "site-content";

async function load(): Promise<SiteContent> {
  if (!supabaseConfigured) return defaultContent;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${CONTENT_TABLE}?id=eq.${PUBLIC_ROW}&select=data`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { tags: [CONTENT_TAG], revalidate: 300 },
    });
    if (!res.ok) return defaultContent;
    const rows = (await res.json()) as { data: unknown }[];
    if (!rows.length || !rows[0].data) return defaultContent;
    return normalizeContent(rows[0].data, defaultContent);
  } catch {
    return defaultContent;
  }
}

// Public content: saved copy (or the built-in one), repaired to the expected shape, hidden items removed.
export const getContent = cache(async (): Promise<SiteContent> => publicContent(await load()));
