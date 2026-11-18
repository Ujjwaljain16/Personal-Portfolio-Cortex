import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { diagrams } from "@/data/diagrams";
import { Pipeline } from "@/components/projects/Pipeline";
import { STATUS_LABEL, type Project } from "@/data/projects";

/**
 * An editorial case-study card for the home page: a visual (the architecture pipeline, else a wide screenshot from the
 * repository), then problem, what was built, and the measured result. The whole card links to /projects/[id].
 */
export function ProjectFeature({ project, index }: { project: Project; index: number }) {
    const { id, name, tagline, status, problem, approach, headline, tech, period } = project;
    const shot = project.gallery?.layout === "wide" ? project.gallery.items[0] : undefined;
    const flow = diagrams[id];
    const flip = index % 2 === 1;

    return (
        <article className="feature-card group relative grid overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className={cn("feature-visual relative min-h-[15rem] flex items-center px-6 py-10", flip && "lg:order-2")} aria-hidden="true">
                {flow ? (
                    <Pipeline steps={flow.steps} compact className="mx-auto max-w-[25rem]" />
                ) : (
                    shot && <Image src={shot.src} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-left-top" />
                )}
            </div>

            <div className="flex flex-col gap-5 p-6 md:p-8">
                <header className="space-y-2">
                    <p className="flex items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-(--text-muted)">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span className="h-px w-6 bg-(--border-hover)" />
                        <span>{STATUS_LABEL[status]}</span>
                        <span className="normal-case tracking-normal">· {period}</span>
                    </p>
                    <h3 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.025em] text-foreground">
                        <Link href={`/projects/${id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                            {name}
                        </Link>
                    </h3>
                    <p className="text-[15.5px] leading-relaxed text-(--text-secondary)">{tagline}</p>
                </header>

                <dl className="grid gap-3.5 text-[14px] leading-relaxed">
                    <div>
                        <dt className="feature-dt">Problem</dt>
                        <dd className="text-(--text-secondary) line-clamp-2">{problem}</dd>
                    </div>
                    {approach[0] && (
                        <div>
                            <dt className="feature-dt">Built</dt>
                            <dd className="text-(--text-secondary) line-clamp-2">{approach[0]}</dd>
                        </div>
                    )}
                    {headline && (
                        <div>
                            <dt className="feature-dt">Result</dt>
                            <dd>
                                <span className="metric-value block text-[22px] leading-tight">{headline.value}</span>
                                <span className="mt-1 block text-[13px] text-(--text-muted)">{headline.label}</span>
                            </dd>
                        </div>
                    )}
                </dl>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="font-mono text-[11.5px] text-(--text-muted)">{tech.slice(0, 4).join(" · ")}</p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-(--accent-primary)">
                        Case study
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                </div>
            </div>
        </article>
    );
}
