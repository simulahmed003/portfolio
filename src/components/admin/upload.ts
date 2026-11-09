"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/supabase";

export type UploadKind = "image" | "file";
const MAX_SIDE = 2000;

const toBlob = (canvas: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

async function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const webp = await toBlob(canvas, "image/webp", 0.85);
  if (webp && webp.type === "image/webp") return webp;
  return toBlob(canvas, "image/jpeg", 0.88); // older Safari cannot write WebP
}

// Resizes photos to at most 2000 px and re-encodes them, so phone pictures upload fast and pages stay light.
export async function compressImage(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const out = await encode(canvas);
    return out && (out.size < file.size || scale < 1) ? out : file;
  } catch {
    return file; // a format this browser cannot read: upload it unchanged
  }
}

export const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

// First page of a PDF as an image (certificates are often PDFs).
export async function pdfFirstPage(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(3, 1800 / Math.max(base.width, base.height)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const out = await encode(canvas);
    if (!out) throw new Error("Could not turn the PDF into an image");
    return out;
  } finally {
    doc.destroy();
  }
}

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

function friendly(msg: string) {
  if (/row-level security|unauthorized|not allowed/i.test(msg)) return "Only the admin account can upload. Sign out and sign in with the admin email.";
  if (/maximum allowed size|too large|413/i.test(msg)) return "That file is too big (20 MB max).";
  if (/fetch|network/i.test(msg)) return "No connection. Check the internet and try again.";
  return msg;
}

export async function uploadBlob(sb: SupabaseClient, blob: Blob, name: string, kind: UploadKind): Promise<string> {
  const ext = EXT[blob.type] ?? (name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const base =
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "file";
  const stamp = new Date().toISOString().slice(0, 7); // 2026-11
  const path = `${kind === "image" ? "images" : "files"}/${stamp}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${base}.${ext}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: blob.type || undefined, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(friendly(error.message));
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Runs async jobs a few at a time (phones choke on 20 parallel uploads).
export async function runLimited<T>(jobs: (() => Promise<T>)[], limit = 3): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await jobs[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}
