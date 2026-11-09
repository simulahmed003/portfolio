import Image from "next/image";

export function SectionHeading({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro?: string; id?: string }) {
  return (
    <div id={id} className="mb-10 max-w-2xl md:mb-14">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">{intro}</p>}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">{children}</span>;
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
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
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
