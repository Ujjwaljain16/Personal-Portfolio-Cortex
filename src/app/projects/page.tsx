import Link from "next/link";
import { ProjectCard } from "@/components/system/ProjectCard";
import { alsoBuilt, featuredProjects, moreProjects } from "@/data/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Projects",
    description: "Projects with the evidence behind each claim and what isn't done yet: databases, protocols, data pipelines and AI systems.",
    path: "/projects",
});

export default function ProjectsPage() {
    return (
        <div className="space-y-10">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">PROJECTS</div>
                <h1 className="text-header mb-1">Projects</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    What I&apos;ve built, with the evidence behind each claim and what isn&apos;t done yet. Each project links to
                    its code; several were course, team or hackathon work, and the page says which.
                </p>
            </header>

            <section aria-labelledby="featured-heading">
                <h2 id="featured-heading" className="text-label mb-3">
                    FEATURED
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:[&>*:last-child:nth-child(odd)]:col-span-2">
                    {featuredProjects.map((p) => (
                        <ProjectCard key={p.id} project={p} variant="feature" />
                    ))}
                </div>
            </section>

            <section aria-labelledby="more-heading">
                <h2 id="more-heading" className="text-label mb-3">
                    MORE PROJECTS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {moreProjects.map((p) => (
                        <ProjectCard key={p.id} project={p} />
                    ))}
                </div>
            </section>

            <section aria-labelledby="also-heading">
                <h2 id="also-heading" className="text-label mb-3">
                    ALSO BUILT
                </h2>
                <ul className="divide-y divide-(--border-default)/60 surface-1">
                    {alsoBuilt.map((a) => (
                        <li key={a.name} className="p-4 text-[14px] leading-relaxed">
                            <a
                                href={`https://github.com/${a.repo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-foreground hover:text-(--accent-primary)"
                            >
                                {a.name} ↗
                            </a>
                            <p className="mt-1 text-(--text-secondary)">{a.line}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <p className="text-[13px] text-(--text-muted)">
                Looking for live repository activity? See the{" "}
                <Link href="/system" className="underline hover:text-(--accent-primary)">
                    system overview
                </Link>
                .
            </p>
        </div>
    );
}
