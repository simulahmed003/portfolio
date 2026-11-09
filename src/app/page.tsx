import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Hero, SECTIONS } from "@/components/sections";
import { getContent } from "@/lib/content";
import { headerProps, siteUrl } from "@/lib/site";
import type { SectionId } from "@/lib/types";

function personJsonLd(c: Awaited<ReturnType<typeof getContent>>) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.hero.name,
    jobTitle: c.hero.eyebrow || undefined,
    description: c.meta.description || undefined,
    url,
    image: c.hero.photo ? new URL(c.hero.photo, url).toString() : undefined,
    address: c.hero.location ? { "@type": "PostalAddress", addressLocality: c.hero.location } : undefined,
    alumniOf: c.education[0]?.school ? { "@type": "CollegeOrUniversity", name: c.education[0].school } : undefined,
    sameAs: c.contact.links.map((l) => l.url).filter((u) => /^https?:\/\//.test(u)),
  };
}

export default async function Home() {
  const c = await getContent();
  return (
    <>
      <SiteHeader {...headerProps(c)} />
      <main>
        <Hero c={c} />
        {c.layout
          .filter((l) => l.show)
          .map((l) => {
            const S = SECTIONS[l.id as SectionId];
            return S ? <S key={l.id} c={c} /> : null;
          })}
      </main>
      <SiteFooter c={c} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(c)).replace(/</g, "\\u003c") }} />
    </>
  );
}
