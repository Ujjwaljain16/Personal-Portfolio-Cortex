import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { diagrams } from "@/data/diagrams";
import { splitPeriod, type Project } from "@/data/projects";
import { StatusPill } from "@/components/projects/StatusPill";
import { AreaTags } from "@/components/projects/AreaTags";

/**
 * A featured project on /projects: the home page's case-study card in a compact, two-column form. Status, name and
 * tagline, the measured result, and the architecture as one line of step names. The whole card links to its page.
 */
export function ProjectSummaryCard({ project, index }: { project: Project; index: number }) {
    const { id, name, tagline, status, headline, period } = project;
    const flow = diagrams[id]?.steps.map((s) => s.title) ?? [];

    return (
        <article className="feature-card group relative flex h-full flex-col gap-5 p-6 md:p-7">
            <header className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <AreaTags areas={project.areas} />
                    <StatusPill status={status} />
                </div>
                <h3 className="text-[24px] font-semibold tracking-[-0.025em] text-foreground">
                    <Link href={`/projects/${id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        {name}
                    </Link>
                </h3>
                <p className="text-[15px] leading-relaxed text-(--text-secondary)">{tagline}</p>
            </header>

            {headline && (
                <div className="border-t border-(--border-default) pt-4">
                    <p className="metric-value text-[21px] leading-tight">{headline.value}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-(--text-muted)">{headline.label}</p>
                </div>
            )}

            {flow.length > 0 && (
                // Each step stays on one line; the row wraps between steps, never inside one.
                <p className="flex flex-wrap items-center gap-y-1 font-mono text-[11.5px] leading-[1.7] text-(--text-muted)" aria-label={`Pipeline: ${flow.join(", then ")}`}>
                    {flow.map((step, i) => (
                        <span key={step} className="inline-flex items-center whitespace-nowrap">
                            {i > 0 && (
                                <span className="px-1.5 text-(--border-hover)" aria-hidden="true">
                                    →
                                </span>
                            )}
                            {step}
                        </span>
                    ))}
                </p>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-(--border-default) pt-4">
                <p className="font-mono text-[11.5px] text-(--text-muted)">
                    {String(index + 1).padStart(2, "0")} · {splitPeriod(period).dates}
                </p>
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-(--accent-primary)">
                    Case study
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </div>
        </article>
    );
}
