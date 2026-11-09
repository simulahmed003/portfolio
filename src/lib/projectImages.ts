import type { Img, ProjectFamily } from "./types";

// Cover first, then every version's photos (newest version first), without duplicates.
export function projectImages(p: ProjectFamily, max = 8): Img[] {
  const out: Img[] = [];
  const seen = new Set<string>();
  const add = (im: Img) => {
    if (im?.src && !seen.has(im.src)) {
      seen.add(im.src);
      out.push(im);
    }
  };
  if (p.cover) add({ src: p.cover, caption: p.title, alt: p.title });
  for (const v of [...p.versions].reverse()) v.images.forEach(add);
  return out.slice(0, max);
}

export function photoCount(p: ProjectFamily) {
  return new Set(p.versions.flatMap((v) => v.images.map((i) => i.src))).size;
}
