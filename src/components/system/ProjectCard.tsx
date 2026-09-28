import Link from "next/link";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type Project, type ProjectStatus } from "@/data/projects";

const STATUS_BADGE: Record<ProjectStatus, string> = {
    ongoing: "badge-success",
    shipped: "badge-info",
    prototype: "badge-info",
    "in-progress": "badge-warning",
};

/**
 * A project card that is a real link to /projects/[id].
 * `feature` shows the first evidence points; `compact` is just the summary.
 */
export function ProjectCard({ project, variant = "compact" }: { project: Project; variant?: "feature" | "compact" }) {
    const { id, name, tagline, status, origin, period, tech, evidence } = project;
    const shownTech = variant === "feature" ? tech.slice(0, 6) : tech.slice(0, 4);

    return (
        <article className="project-card surface-1 p-5 flex flex-col gap-3 relative">
            <header className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-semibold text-foreground">
                    {/* Stretched link: the whole card is clickable with a real accessible name. */}
                    <Link href={`/projects/${id}`} className="after:absolute after:inset-0 after:content-['']">
                        {name}
                    </Link>
                </h3>
                <span className={cn("badge shrink-0", STATUS_BADGE[status])}>{STATUS_LABEL[status]}</span>
            </header>

            <p className="text-[14px] leading-relaxed text-(--text-secondary)">{tagline}</p>

            <p className="text-[12px] font-mono text-(--text-muted)">
                {origin} · {period}
            </p>

            {variant === "feature" && (
                <ul className="space-y-2 text-[13px] leading-relaxed text-(--text-secondary) list-disc pl-5">
                    {evidence.slice(0, 2).map((e) => (
                        <li key={e.text}>{e.text}</li>
                    ))}
                </ul>
            )}

            <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Technologies">
                {shownTech.map((t) => (
                    <li
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                    >
                        {t}
                    </li>
                ))}
                {tech.length > shownTech.length && (
                    <li className="text-[11px] px-1 py-0.5 text-(--text-muted) font-mono">+{tech.length - shownTech.length}</li>
                )}
            </ul>
        </article>
    );
}
