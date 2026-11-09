import Pic from "./Pic";

export function SectionHeading({ eyebrow, title, intro, as = "h2" }: { eyebrow?: string; title: string; intro?: string; as?: "h1" | "h2" }) {
  const H = as;
  if (!eyebrow && !title && !intro) return null;
  return (
    <div className="mb-10 max-w-2xl md:mb-14">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      {title && <H className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</H>}
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">{intro}</p>}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">{children}</span>;
}

// Shows an image, or a branded placeholder when no image is set yet.
export function Cover({ src, alt, label, sizes, priority, className = "" }: { src: string; alt: string; label: string; sizes: string; priority?: boolean; className?: string }) {
  if (!src) {
    return (
      <div className={`bg-grid relative flex items-center justify-center overflow-hidden bg-surface-2 ${className}`}>
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.55">
            <path d="M0 60h120l30 30h90l20-20h140" />
            <path d="M0 170h80l40-40h100l30 30h150" />
            <path d="M200 0v50l20 20v60l-20 20v90" />
          </g>
          <g fill="var(--accent)" opacity="0.7">
            <circle cx="150" cy="90" r="4" /><circle cx="240" cy="90" r="4" /><circle cx="120" cy="130" r="4" /><circle cx="250" cy="160" r="4" />
          </g>
        </svg>
        <span className="relative max-w-[80%] text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      <Pic src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// GitHub's mark, used only to point at GitHub repositories.
export function GithubIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function LinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" />
    </svg>
  );
}
