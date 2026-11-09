import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { CONTENT_TAG } from "@/lib/content";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase";

// Called by /admin after a save so the public pages show the new content immediately.
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await sb.auth.getUser(token);
  const admin = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
  if (error || !data.user || (admin && data.user.email?.toLowerCase() !== admin)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
