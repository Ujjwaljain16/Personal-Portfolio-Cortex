import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Gallery } from "@/components/projects/Gallery";
import { STATUS_LABEL, getProject, projects, sourceUrl, type ProjectStatus } from "@/data/projects";

const STATUS_BADGE: Record<ProjectStatus, string> = {
    ongoing: "badge-success",
    shipped: "badge-info",
    prototype: "badge-info",
    "in-progress": "badge-warning",
};

export function generateStaticParams() {
    return projects.map((p) => ({ id: p.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = getProject(id);
    if (!project) notFound();

    const index = projects.findIndex((p) => p.id === project.id);
    const next = projects[(index + 1) % projects.length];

    return (
        <article className="max-w-3xl pb-10 space-y-10">
            <header className="space-y-4">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-secondary) hover:text-(--accent-primary)"
                >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    All projects
                </Link>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{project.name}</h1>
                    <span className={cn("badge", STATUS_BADGE[project.status])}>{STATUS_LABEL[project.status]}</span>
                </div>

                <p className="text-[16px] leading-relaxed text-(--text-secondary)">{project.tagline}</p>

                <p className="text-[13px] font-mono text-(--text-muted)">
                    {project.origin} · {project.period}
                </p>

                <ul className="flex flex-wrap gap-2">
                    {project.links.map((l) => (
                        <li key={l.href}>
                            <a
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center min-h-11 px-4 rounded-lg border border-(--border-hover) bg-(--bg-surface-2) text-[13px] font-mono text-foreground hover:border-(--accent-primary) hover:text-(--accent-primary)"
                            >
                                {l.label} ↗
                            </a>
                        </li>
                    ))}
                </ul>
            </header>

            <section aria-labelledby="problem">
                <h2 id="problem" className="text-label mb-2">
                    THE PROBLEM
                </h2>
                <p className="text-[15px] leading-relaxed text-(--text-secondary)">{project.problem}</p>
            </section>

            <section aria-labelledby="approach">
                <h2 id="approach" className="text-label mb-2">
                    HOW IT WORKS
                </h2>
                <ul className="space-y-3 list-disc pl-5 text-[15px] leading-relaxed text-(--text-secondary)">
                    {project.approach.map((a) => (
                        <li key={a}>{a}</li>
                    ))}
                </ul>
            </section>

            {project.gallery && (
                <section aria-labelledby="screens">
                    <h2 id="screens" className="text-label mb-3">
                        SCREENSHOTS
                    </h2>
                    <Gallery gallery={project.gallery} />
                    <p className="mt-2 text-[12px] font-mono text-(--text-muted)">
                        Captured from the project&apos;s own repository. Select an image to open it full size.
                    </p>
                </section>
            )}

            <section aria-labelledby="evidence">
                <h2 id="evidence" className="text-label mb-2">
                    ENGINEERING EVIDENCE
                </h2>
                <ul className="space-y-4">
                    {project.evidence.map((e) => (
                        <li key={e.text} className="text-[15px] leading-relaxed text-(--text-secondary)">
                            {e.text}
                            {e.source && (
                                <>
                                    {" "}
                                    <a
                                        href={sourceUrl(project.repo, e.source)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[12px] text-(--accent-primary) hover:underline break-all"
                                    >
                                        {e.source.split("/").pop()} ↗
                                    </a>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="limits" className="surface-1 p-5">
                <h2 id="limits" className="text-label mb-2">
                    WHAT ISN&apos;T DONE
                </h2>
                <ul className="space-y-2 list-disc pl-5 text-[15px] leading-relaxed text-(--text-secondary)">
                    {project.limitations.map((l) => (
                        <li key={l}>{l}</li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="stack">
                <h2 id="stack" className="text-label mb-2">
                    STACK
                </h2>
                <ul className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                        <li
                            key={t}
                            className="text-[12px] px-2.5 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                        >
                            {t}
                        </li>
                    ))}
                </ul>
            </section>

            <footer className="border-t border-(--border-default) pt-6">
                <Link
                    href={`/projects/${next.id}`}
                    className="inline-flex items-center gap-2 min-h-11 text-[14px] font-mono text-(--text-secondary) hover:text-(--accent-primary)"
                >
                    Next: {next.name}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
            </footer>
        </article>
    );
}
