"use client";
import { createContext, useContext } from "react";

export type Path = (string | number)[];
export type Toast = (msg: string, action?: { label: string; run: () => void }) => void;

export type AdminCtx = {
  // Changes the value at `path` in the content. Edits to the same field in quick succession form one undo step;
  // `step: true` always starts a new one (use it for add, delete, move).
  edit: (path: Path, fn: (old: unknown) => unknown, opts?: { step?: boolean }) => void;
  set: (path: Path, value: unknown, opts?: { step?: boolean }) => void; // edit with a plain value
  undo: () => void;
  // Uploads a photo (resized in the browser). A PDF becomes an image of its first page; onPdf gets the original PDF's address.
  uploadImage: (file: File, onPdf?: (pdfUrl: string) => void) => Promise<string>;
  uploadFile: (file: File) => Promise<string>;
  library: string[]; // every image address used anywhere on the site, for "Choose from uploaded"
  categories: string[]; // project categories in use
  toast: Toast;
};

export const AdminContext = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const c = useContext(AdminContext);
  if (!c) throw new Error("useAdmin outside AdminContext");
  return c;
}

export function getIn(root: unknown, path: Path): unknown {
  let cur = root;
  for (const k of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

// Immutable update: returns the same object when nothing changed.
export function setIn(root: unknown, path: Path, fn: (old: unknown) => unknown): unknown {
  if (!path.length) return fn(root);
  const [k, ...rest] = path;
  if (Array.isArray(root)) {
    const i = Number(k);
    if (!(i >= 0 && i < root.length)) return root;
    const nv = setIn(root[i], rest, fn);
    if (nv === root[i]) return root;
    const copy = root.slice();
    copy[i] = nv;
    return copy;
  }
  const o = (root && typeof root === "object" ? root : {}) as Record<string, unknown>;
  const nv = setIn(o[k as string], rest, fn);
  if (nv === o[k as string]) return root;
  return { ...o, [k]: nv };
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const a = arr.slice();
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}
