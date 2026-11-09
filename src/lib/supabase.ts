import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const MEDIA_BUCKET = "portfolio-media";
export const CONTENT_TABLE = "portfolio_content";

// Rows in CONTENT_TABLE:
//   main             what visitors see (hidden items already removed); readable by anyone
//   admin            the full content including hidden items; only the admin can read it
//   history-<time>   earlier saves, for restoring; only the admin can read them
export const PUBLIC_ROW = "main";
export const ADMIN_ROW = "admin";
export const HISTORY_PREFIX = "history-";
export const HISTORY_KEEP = 30;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function browserClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Images on our own site or in Supabase Storage go through Next's optimizer; anything else is shown as is.
export function optimizable(src: string) {
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    return new URL(src).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}
