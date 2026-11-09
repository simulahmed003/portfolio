import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProjectBrowser from "@/components/ProjectBrowser";
import { SectionHeading } from "@/components/ui";
import { getContent } from "@/lib/content";
import { headerProps } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return { title: c.labels.allProjectsTitle, alternates: { canonical: "/projects" } };
}

export default async function ProjectsPage() {
  const c = await getContent();
  return (
    <>
      <SiteHeader {...headerProps(c)} />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <SectionHeading as="h1" eyebrow={c.projectsSection.eyebrow} title={c.labels.allProjectsTitle} intro={c.projectsSection.intro} />
        <ProjectBrowser projects={c.projects} labels={c.labels} />
      </main>
      <SiteFooter c={c} />
    </>
  );
}
