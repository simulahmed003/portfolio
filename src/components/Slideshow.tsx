"use client";
import Pic from "./Pic";
import { useEffect, useState } from "react";
import type { Img } from "@/lib/types";

// Auto-rotating crossfade slideshow used on project cards. Pauses on hover and for reduced-motion users.
export default function Slideshow({
  images,
  sizes,
  interval = 4200,
  priority,
  className = "",
}: {
  images: Img[];
  sizes: string;
  interval?: number;
  priority?: boolean;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = images.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // small random offset so cards on one page don't all change at the same moment
    const t = setInterval(() => setI((x) => (x + 1) % n), interval + Math.round(Math.random() * 800));
    return () => clearInterval(t);
  }, [n, paused, interval]);

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {images.map((im, j) => {
        // only mount the current, next and first image to keep pages light
        const near = j === i || j === (i + 1) % n || j === 0;
        if (!near) return null;
        return (
          <Pic
            key={im.src + j}
            src={im.src}
            alt={im.alt || im.caption}
            fill
            sizes={sizes}
            priority={priority && j === 0}
            className={`object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${j === i ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
          />
        );
      })}
      {n > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur" aria-hidden>
          {images.map((_, j) => (
            <span key={j} className={`h-1.5 rounded-full transition-all duration-500 ${j === i ? "w-4 bg-white" : "w-1.5 bg-white/45"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
