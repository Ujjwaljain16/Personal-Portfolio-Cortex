import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Gallery } from "@/components/projects/Gallery";
import { Pipeline } from "@/components/projects/Pipeline";
import { StatusPill } from "@/components/projects/StatusPill";
import { AreaTags } from "@/components/projects/AreaTags";
import { OnThisPage } from "@/components/projects/OnThisPage";
import { RelatedRecords } from "@/components/projects/RelatedRecords";
import { diagrams } from "@/data/diagrams";
import { lastCommitBranch, lastCommitDate } from "@/data/openSource";
import { records } from "@/data/records";
import { getProject, orderedProjects, projects, sourceUrl, splitPeriod, type Project } from "@/data/projects";
import { pageMetadata } from "@/lib/seo";
import { projectLogo } from "@/data/projectLogos";

/** A project id that used to have its own page. Visiting it redirects instead of 404ing. */
const REMOVED_PROJECT_IDS: Record<string, string> = {
    "lexis-ai": "/projects", // now a one-line entry under "Also built"
    gitissue: "/projects", // removed from the portfolio (Nov 2026)
    "bhttp-1": "/projects", // now a one-line entry under "Also built"
};

export function generateStaticParams() {
    return [...projects.map((p) => ({ id: p.id })), ...Object.keys(REMOVED_PROJECT_IDS).map((id) => ({ id }))];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const project = getProject(id);
    if (!project || REMOVED_PROJECT_IDS[id]) return {};
    return pageMetadata({
        title: project.name,
        description: `${project.tagline} ${project.origin}, ${project.period}.`,
        path: `/projects/${project.id}`,
        ownImage: true,
    });
}

/** One numbered section of the case study. The number is its position on this page, so it never skips. */
function Section({ id, n, title, aside, children }: { id: string; n: number; title: string; aside?: ReactNode; children: ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-8 border-t border-(--border-default) pt-10">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`${id}-heading`} className="flex items-baseline gap-3 text-[21px] md:text-[23px] font-semibold tracking-[-0.02em] text-foreground">
                    <span className="font-mono text-[12px] font-normal tracking-normal text-(--text-muted)">{String(n).padStart(2, "0")}</span>
                    {title}
                </h2>
                {aside}
            </div>
            {children}
        </section>
    );
}

/** The neighbouring project in reading order, with its headline number when it has one. */
function Neighbour({ project, dir }: { project: Project; dir: "prev" | "next" }) {
    return (
        <Link
            href={`/projects/${project.id}`}
            className={`group block h-full rounded-2xl border border-(--border-default) bg-(--bg-surface-1) p-5 transition-colors hover:border-(--border-hover) ${dir === "next" ? "sm:text-right" : ""}`}
        >
            <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted) ${dir === "next" ? "sm:justify-end" : ""}`}>
                {dir === "prev" && <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />}
                {dir === "prev" ? "Previous" : "Next"}
                {dir === "next" && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
            </span>
            <span className="mt-2 block text-[18px] font-semibold tracking-[-0.01em] text-foreground">{project.name}</span>
            {project.headline && <span className="mt-1 block font-mono text-[13px] text-(--text-secondary)">{project.headline.value}</span>}
        </Link>
    );
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = getProject(id);
    if (!project) {
        const redirectTo = REMOVED_PROJECT_IDS[id];
        if (redirectTo) permanentRedirect(redirectTo);
        notFound();
    }

    const related = records.filter((r) => r.projectId === project.id);
    const diagram = diagrams[project.id];
    const at = orderedProjects.findIndex((p) => p.id === project.id);
    const prev = orderedProjects[(at - 1 + orderedProjects.length) % orderedProjects.length];
    const next = orderedProjects[(at + 1) % orderedProjects.length];
    const { dates, note } = splitPeriod(project.period);
    const committed = lastCommitDate(project.repo);
    const branch = lastCommitBranch(project.repo);
    const [primary, ...secondary] = project.links;
    const logo = projectLogo(project.id);

    // The sections this project has, in order; each is numbered by its position and listed in "On this page".
    const sections = [
        { id: "problem", label: "Problem", show: true },
        { id: "demo", label: "Demo", show: !!project.demo },
        { id: "how-it-works", label: "How it works", show: project.approach.length > 0 },
        { id: "pipeline", label: "Pipeline", show: !!diagram },
        { id: "screenshots", label: "Screenshots", show: !!project.gallery },
        { id: "evidence", label: "Evidence", show: project.evidence.length > 0 },
        { id: "records", label: "Decisions and investigations", show: related.length > 0 },
        { id: "not-done", label: "What isn't done", show: project.limitations.length > 0 },
        { id: "next-steps", label: "Next steps", show: !!project.next?.length },
        { id: "stack", label: "Stack", show: project.tech.length > 0 },
    ].filter((s) => s.show);
    const num = (sectionId: string) => sections.findIndex((s) => s.id === sectionId) + 1;

    return (
        <article className="project-page pb-16 [overflow-wrap:anywhere]">
            {/* .main-panel > * fixes the article's own width, so the page's frame is set one level in. Hero, text and
                contents list share it, which keeps their right edges aligned. */}
            <div className="max-w-[62rem]">
            {/* Hero */}
            <header className="space-y-8 pb-12">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-muted) hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    All projects
                </Link>

                <div className="space-y-5">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">
                        <span>{project.origin}</span>
                        <span aria-hidden="true" className="h-px w-5 bg-(--border-hover)" />
                        <AreaTags areas={project.areas} className="text-[12px] tracking-[0.14em]" />
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {logo && (
                            // The project's own logo, decorative beside its name. Copied from its repository (see projectLogos.ts).
                            <Image src={logo.src} alt="" width={52} height={52} unoptimized className={logo.tile ? "project-logo" : "project-logo is-mark"} />
                        )}
                        <h1 className="text-[2.5rem] leading-[1.05] md:text-[3.25rem] font-semibold tracking-[-0.035em] text-foreground">{project.name}</h1>
                        <StatusPill status={project.status} />
                    </div>
                    <p className="max-w-[44rem] text-[18px] md:text-[20px] leading-[1.5] tracking-[-0.01em] text-(--text-secondary)">{project.tagline}</p>
                </div>

                <dl
                    className={`project-facts grid grid-cols-2 ${
                        project.headline ? "sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]" : ""
                    }`}
                >
                    {project.headline && (
                        <div className="fact-result">
                            <dt>Result</dt>
                            <dd>
                                <span className="metric-value block text-[24px] md:text-[28px] leading-tight">{project.headline.value}</span>
                                <span className="mt-2 block text-[13px] leading-relaxed text-(--text-secondary)">{project.headline.label}</span>
                            </dd>
                        </div>
                    )}
                    <div className="fact-period">
                        <dt>Period</dt>
                        <dd>
                            <span className="block text-[15px] font-medium text-foreground">{dates}</span>
                            {note && <span className="mt-1.5 block text-[13px] leading-relaxed text-(--text-secondary)">{note}</span>}
                        </dd>
                    </div>
                    {committed && (
                        <div className="fact-commit">
                            <dt>Last commit</dt>
                            <dd>
                                <span className="block text-[15px] font-medium text-foreground">{formatDate(committed)}</span>
                                <span className="mt-1.5 block text-[13px] text-(--text-secondary)">{branch ? `on the ${branch} branch` : "default branch"}</span>
                            </dd>
                        </div>
                    )}
                </dl>

                {primary && (
                    <ul className="flex flex-wrap items-center gap-3">
                        <li>
                            <a
                                href={primary.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hero-cta inline-flex items-center min-h-11 px-5 rounded-full text-[14px] font-medium"
                            >
                                {primary.label}
                            </a>
                        </li>
                        {secondary.map((l) => (
                            <li key={l.href}>
                                <a
                                    href={l.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center min-h-11 px-5 rounded-full border border-(--border-hover) text-[14px] text-foreground hover:border-(--text-muted) transition-colors"
                                >
                                    {l.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            <div className="grid gap-12 lg:grid-cols-[minmax(0,42rem)_12rem] lg:justify-between">
                <div className="min-w-0 space-y-14">
                    <Section id="problem" n={num("problem")} title="Problem">
                        <p className="text-[17px] md:text-[18px] leading-[1.65] text-foreground">{project.problem}</p>
                    </Section>

                    {project.demo && (
                        <Section id="demo" n={num("demo")} title="Demo">
                            <figure className="space-y-3">
                                <video
                                    controls
                                    muted
                                    loop
                                    playsInline
                                    preload="none"
                                    poster={project.demo.poster}
                                    className={`rounded-2xl border border-(--border-default) bg-(--bg-surface-1) ${
                                        project.demo.portrait ? "mx-auto block h-[min(78vh,42rem)] aspect-[9/20]" : "w-full aspect-video"
                                    }`}
                                >
                                    {project.demo.webm && <source src={project.demo.webm} type="video/webm" />}
                                    <source src={project.demo.mp4} type="video/mp4" />
                                    <a href={project.demo.mp4}>Download the demo video</a>
                                </video>
                                <figcaption className="text-[13px] leading-relaxed text-(--text-muted)">
                                    {project.demo.caption}
                                    {project.demo.full && (
                                        <>
                                            {" "}
                                            <a href={project.demo.full.mp4} className="text-(--accent-primary) hover:underline">
                                                {project.demo.full.label}
                                            </a>
                                        </>
                                    )}
                                </figcaption>
                            </figure>
                        </Section>
                    )}

                    {project.approach.length > 0 && (
                        <Section id="how-it-works" n={num("how-it-works")} title="How it works">
                            <ul className="prose-list">
                                {project.approach.map((a) => (
                                    <li key={a}>{a}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {diagram && (
                        <Section id="pipeline" n={num("pipeline")} title="Pipeline">
                            <figure className="space-y-6">
                                <div className="rounded-2xl border border-(--border-default) bg-(--bg-surface-1) p-6 md:p-8">
                                    <Pipeline steps={diagram.steps} />
                                </div>
                                <figcaption className="text-[14px] leading-relaxed text-(--text-muted)">{diagram.caption}</figcaption>
                            </figure>
                        </Section>
                    )}

                    {project.gallery && (
                        <Section id="screenshots" n={num("screenshots")} title="Screenshots">
                            <Gallery gallery={project.gallery} />
                            <p className="mt-3 text-[13px] text-(--text-muted)">
                                Captured from the project&apos;s own repository. Select an image to open it full size.
                            </p>
                        </Section>
                    )}

                    <Section
                        id="evidence"
                        n={num("evidence")}
                        title="Evidence"
                        aside={<span className="font-mono text-[12px] text-(--text-muted)">{project.evidence.length} items</span>}
                    >
                        <ol className="evidence-list">
                            {project.evidence.map((e, i) => (
                                <li key={e.text}>
                                    <span className="evidence-index" aria-hidden="true">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <div className="min-w-0 space-y-2.5">
                                        <p>{e.text}</p>
                                        {e.source && (
                                            <a
                                                href={sourceUrl(project.repo, e.source)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="source-chip"
                                                title="Open the source file on GitHub"
                                            >
                                                <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                <span className="min-w-0 break-all">{e.source.split("@")[0]}</span>
                                            </a>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Section>

                    {related.length > 0 && (
                        <Section id="records" n={num("records")} title="Decisions and investigations">
                            <RelatedRecords records={related} />
                        </Section>
                    )}

                    <Section
                        id="not-done"
                        n={num("not-done")}
                        title="What isn't done"
                        aside={<span className="font-mono text-[12px] text-(--text-muted)">{project.limitations.length} open</span>}
                    >
                        <div className="rounded-2xl border border-(--border-default) bg-(--bg-surface-1) p-6 md:p-7">
                            <ul className="prose-list prose-list-tight">
                                {project.limitations.map((l) => (
                                    <li key={l}>{l}</li>
                                ))}
                            </ul>
                        </div>
                    </Section>

                    {project.next && project.next.length > 0 && (
                        <Section id="next-steps" n={num("next-steps")} title="Next steps">
                            <p className="mb-5 text-[14px] text-(--text-muted)">
                                Each one comes from a gap listed above. It says what fixing the gap would take; it is not a promise.
                            </p>
                            <ul className="prose-list">
                                {project.next.map((n) => (
                                    <li key={n}>{n}</li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    <Section id="stack" n={num("stack")} title="Stack">
                        <ul className="flex flex-wrap gap-2">
                            {project.tech.map((t) => (
                                <li
                                    key={t}
                                    className="rounded-full border border-(--border-default) px-3 py-1 font-mono text-[12px] text-(--text-secondary)"
                                >
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </Section>
                </div>

                <aside className="hidden lg:block">
                    <div className="sticky top-8">
                        <OnThisPage items={sections.map(({ id: sid, label }) => ({ id: sid, label }))} />
                    </div>
                </aside>
            </div>

            <nav aria-label="More projects" className="mt-20 grid gap-4 sm:grid-cols-2">
                <Neighbour project={prev} dir="prev" />
                <Neighbour project={next} dir="next" />
            </nav>
            </div>
        </article>
    );
}
