import { cn } from "@/lib/utils";
import type { Project } from "@/data/projects";

const STATUS_BADGE: Record<Project["status"], string> = {
    active: "badge-success",
    stable: "badge-info",
    archived: "badge-warning",
    "in-dev": "badge-warning",
};

function linkLabel(url: string): string {
    if (url.includes("github.com")) return "Source on GitHub";
    if (url.includes("npmjs.com")) return "Package on npm";
    return "Open project";
}

export function ProjectCard({ project }: { project: Project }) {
    const { name, status, description, tech, architectureSummary, link } = project;

    return (
        <article className="project-card surface-1 p-4 flex flex-col gap-3">
            <header className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-medium text-foreground">{name}</h3>
                <span className={cn("badge shrink-0", STATUS_BADGE[status])}>{status}</span>
            </header>

            <p className="text-[13px] leading-relaxed text-(--text-secondary)">{description}</p>

            <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
                {tech.map((t) => (
                    <li
                        key={t}
                        className="tech-tag text-[11px] px-2 py-0.5 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                    >
                        {t}
                    </li>
                ))}
            </ul>

            <details className="disclosure text-[13px]">
                <summary className="text-(--text-secondary) hover:text-(--accent-primary) py-1 select-none">
                    Architecture
                </summary>
                <p className="mt-2 leading-relaxed text-(--text-secondary)">{architectureSummary}</p>
            </details>

            {link && (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto text-[13px] font-mono text-(--accent-primary) hover:underline"
                >
                    {linkLabel(link)} ↗
                </a>
            )}
        </article>
    );
}
