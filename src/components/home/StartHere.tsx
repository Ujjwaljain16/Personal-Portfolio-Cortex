import Link from "next/link";
import { startHere } from "@/data/startHere";
import { getProject } from "@/data/projects";
import { getRecord } from "@/data/records";

function recordHref(recordId: string): string {
    const r = getRecord(recordId);
    return `/${r?.kind === "decision" ? "decisions" : "investigations"}#${recordId}`;
}

export function StartHere() {
    return (
        <section aria-labelledby="start-here-heading" className="space-y-4">
            <div>
                <h2 id="start-here-heading" className="text-2xl font-semibold text-foreground">
                    Start here
                </h2>
                <p className="mt-2 text-[15px] text-(--text-secondary) max-w-2xl">
                    Three things I would ask you to check first. Each is one claim, with the record that holds the evidence, the
                    method, and what I could not show.
                </p>
            </div>
            <ul className="surface-1 divide-y divide-(--border-default)/60">
                {startHere.map((item) => {
                    const project = getProject(item.projectId);
                    if (!project) return null;
                    return (
                        <li key={item.projectId} className="p-4 grid gap-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
                            <Link
                                href={`/projects/${project.id}`}
                                className="text-[12px] font-mono uppercase tracking-wider text-(--accent-primary) hover:underline sm:pt-0.5"
                            >
                                {project.name}
                            </Link>
                            <div className="space-y-2">
                                <p className="text-[15px] leading-relaxed text-(--text-secondary)">{item.claim}</p>
                                <p className="flex flex-wrap gap-x-4 gap-y-1">
                                    {item.links.map((l) => (
                                        <Link
                                            key={l.recordId}
                                            href={recordHref(l.recordId)}
                                            className="font-mono text-[12px] text-(--accent-primary) hover:underline"
                                        >
                                            {l.label} →
                                        </Link>
                                    ))}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
