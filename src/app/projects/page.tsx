import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ProjectTile } from "@/components/ProjectCards";
import { SectionHeading } from "@/components/ui";
import { getContent, visibleProjects } from "@/lib/content";

export const metadata: Metadata = { title: "All projects" };

export default async function ProjectsPage() {
  const c = await getContent();
  const list = visibleProjects(c);
  const cats = Array.from(new Set(list.map((p) => p.category)));
  return (
    <>
      <SiteHeader name={c.hero.name} cvUrl={c.contact.cvUrl} />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <SectionHeading eyebrow="Projects" title="All projects" intro={c.projectsSection.intro} />
        {cats.map((cat) => (
          <section key={cat} className="mb-14">
            <h2 className="mb-5 border-b border-line pb-3 font-mono text-xs uppercase tracking-wider text-accent">{cat}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.filter((p) => p.category === cat).map((p) => (
                <ProjectTile key={p.slug} p={p} />
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter c={c} />
    </>
  );
}
