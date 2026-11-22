import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectSummaryCard } from "@/components/projects/ProjectSummaryCard";
import { StatusPill } from "@/components/projects/StatusPill";
import { AREAS, alsoBuilt, featuredProjects, moreProjects, projects, splitPeriod } from "@/data/projects";
import { AreaFilter } from "@/components/projects/AreaFilter";
import { AreaTags } from "@/components/projects/AreaTags";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Projects",
    description: "Projects with the evidence behind each claim and what isn't done yet: databases, protocols, data pipelines and AI systems.",
    path: "/projects",
});

/** Section heading for this page: a mono index and label, a title, and an optional count on the right. */
function Heading({ id, index, title, count }: { id: string; index: string; title: string; count: string }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-(--border-default) pb-4">
            <div className="space-y-1.5">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-(--text-muted)">{index}</p>
                <h2 id={id} className="text-[22px] md:text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                    {title}
                </h2>
            </div>
            <p data-filter-count className="font-mono text-[12px] text-(--text-muted)">
                {count}
            </p>
        </div>
    );
}

export default function ProjectsPage() {
    const areaCounts = AREAS.map((a) => ({ ...a, count: projects.filter((p) => p.areas.includes(a.id)).length })).filter((a) => a.count > 0);

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-16">
                <header className="space-y-5 pt-2">
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">{projects.length} projects</p>
                    <h1 className="text-[2.5rem] leading-[1.05] md:text-[3.25rem] font-semibold tracking-[-0.035em] text-foreground">Projects</h1>
                    <p className="max-w-[44rem] text-[17px] md:text-[18px] leading-[1.6] text-(--text-secondary)">
                        What I&apos;ve built, with the evidence behind each claim and what isn&apos;t done yet. Each project links to its
                        code; several were course, team or hackathon work, and the page says which.
                    </p>
                    <div className="pt-3">
                        <AreaFilter areas={areaCounts} total={projects.length} />
                    </div>
                </header>

                <section aria-labelledby="featured-heading" data-filter-section>
                    <Heading id="featured-heading" index="01" title="Selected work" count={`${featuredProjects.length} projects`} />
                    <div className="grid gap-5 md:grid-cols-2">
                        {featuredProjects.map((p, i) => (
                            <div key={p.id} data-areas={p.areas.join(" ")}>
                                <ProjectSummaryCard project={p} index={i} />
                            </div>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="more-heading" data-filter-section>
                    <Heading id="more-heading" index="02" title="More projects" count={`${moreProjects.length} projects`} />
                    <ul className="project-rows">
                        {moreProjects.map((p) => (
                            <li key={p.id} className="group relative" data-areas={p.areas.join(" ")}>
                                <div className="grid gap-x-8 gap-y-2 md:grid-cols-[minmax(0,1fr)_11rem] md:items-start">
                                    <div className="min-w-0 space-y-1.5">
                                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground group-hover:text-(--accent-primary) transition-colors">
                                                <Link href={`/projects/${p.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                                                    {p.name}
                                                </Link>
                                            </h3>
                                            <AreaTags areas={p.areas} />
                                        </div>
                                        <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">{p.tagline}</p>
                                        <p className="font-mono text-[11.5px] text-(--text-muted)">{p.tech.slice(0, 4).join(" · ")}</p>
                                    </div>
                                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2 md:pt-0.5">
                                        <StatusPill status={p.status} />
                                        <span className="font-mono text-[12px] text-(--text-muted) md:text-right">{splitPeriod(p.period).dates}</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="also-heading" data-filter-section>
                    <Heading id="also-heading" index="03" title="Also built" count={`${alsoBuilt.length} repositories`} />
                    <ul className="project-rows">
                        {alsoBuilt.map((a) => (
                            <li key={a.name} className="group relative">
                                <div className="grid gap-x-8 gap-y-1.5 md:grid-cols-[minmax(0,1fr)_11rem] md:items-baseline">
                                    <div className="min-w-0 space-y-1.5">
                                        <h3 className="text-[16px] font-semibold text-foreground group-hover:text-(--accent-primary) transition-colors">
                                            <a
                                                href={`https://github.com/${a.repo}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                                            >
                                                {a.name}
                                            </a>
                                        </h3>
                                        <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">{a.line}</p>
                                    </div>
                                    <span className="font-mono text-[12px] text-(--text-muted) md:text-right">{a.repo}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <Link
                    href="/system"
                    className="inline-flex items-center gap-2 min-h-11 font-mono text-[13px] text-(--text-muted) hover:text-foreground transition-colors"
                >
                    Live repository activity is on the system page
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}
