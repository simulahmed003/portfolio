import { NextResponse } from "next/server";
import { CONTENT_TABLE, SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase";

// Watchdog: Supabase free projects pause after ~7 days without activity.
// Vercel Cron (vercel.json) calls this every day so the database always sees a real query.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json({ ok: false, reason: "Supabase not configured" });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${CONTENT_TABLE}?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  return NextResponse.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 });
}
