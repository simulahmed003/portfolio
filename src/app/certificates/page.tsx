import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { AwardCards, CertificateBrowser } from "@/components/Certificates";
import { SectionHeading } from "@/components/ui";
import { getContent } from "@/lib/content";
import { headerProps } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return { title: c.labels.certificatesTitle, description: c.labels.certificatesIntro, alternates: { canonical: "/certificates" } };
}

export default async function CertificatesPage() {
  const c = await getContent();
  return (
    <>
      <SiteHeader {...headerProps(c)} />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <SectionHeading as="h1" eyebrow={c.recognitionSection.eyebrow} title={c.labels.certificatesTitle} intro={c.labels.certificatesIntro} />
        {c.awards.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 text-xl font-semibold tracking-tight">{c.labels.awardsHeading}</h2>
            <AwardCards items={c.awards} labels={c.labels} />
          </section>
        )}
        {c.certificates.length > 0 && (
          <section>
            {c.awards.length > 0 && <h2 className="mb-6 text-xl font-semibold tracking-tight">{c.recognitionSection.certificatesHeading}</h2>}
            <CertificateBrowser items={c.certificates} labels={c.labels} />
          </section>
        )}
      </main>
      <SiteFooter c={c} />
    </>
  );
}
