import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    deployments,
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    type Deployment,
    type DeploymentStatus,
} from "@/data/deployments";
import { decisions } from "@/data/decisions";
import { experiments } from "@/data/experiments";

const STATUS: Record<DeploymentStatus, { label: string; className: string }> = {
    active: { label: "ACTIVE", className: "text-(--success)" },
    device: { label: "DEVICE", className: "text-(--accent-secondary)" },
    packaged: { label: "PACKAGED", className: "text-(--accent-primary)" },
    published: { label: "PUBLISHED", className: "text-(--accent-primary)" },
    library: { label: "LIBRARY", className: "text-(--text-secondary)" },
};

// Shared column template: desktop reads as a table, small screens stack as cards.
const ROW_GRID = "md:grid md:grid-cols-[9rem_minmax(0,1fr)_10rem_7rem] md:gap-4 md:items-center";

function liveLabel(url: string): string {
    if (url.includes("/releases/download/")) return "Download release";
    if (url.includes("npmjs.com")) return "View package on npm";
    return "Open live site";
}

/**
 * Deployment surfaces. Each row is a native <details>: keyboard and touch
 * accessible, no JS. Commit hashes and latency figures are intentionally not
 * shown until they can be verified (see the data audit).
 */
export function DeploymentTable() {
    return (
        <div className="space-y-8">
            {CATEGORY_ORDER.map((category) => {
                const entries = deployments
                    .filter((d) => d.category === category)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                if (entries.length === 0) return null;

                return (
                    <section key={category} aria-labelledby={`dep-${category}`}>
                        <h2 id={`dep-${category}`} className="text-label mb-3">
                            {CATEGORY_LABELS[category]} <span className="text-(--text-muted)">({entries.length})</span>
                        </h2>

                        <div
                            aria-hidden="true"
                            className={cn("hidden px-4 pb-2 text-label", ROW_GRID, "md:pl-[calc(1rem+1.1em)]")}
                        >
                            <div>REPO</div>
                            <div>WHAT</div>
                            <div>SURFACE</div>
                            <div>STATUS</div>
                        </div>

                        <ul className="space-y-2">
                            {entries.map((deployment) => (
                                <li key={deployment.id}>
                                    <DeploymentRow deployment={deployment} />
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}

function DeploymentRow({ deployment }: { deployment: Deployment }) {
    const status = STATUS[deployment.status];
    const relatedDecision = deployment.relatedDecisionId
        ? decisions.find((d) => d.id === deployment.relatedDecisionId)
        : undefined;
    const relatedExperiment = deployment.relatedExperimentId
        ? experiments.find((e) => e.id === deployment.relatedExperimentId)
        : undefined;

    return (
        <article id={deployment.id} className="scroll-mt-4">
            <details className="disclosure surface-1">
                <summary className="p-4">
                    <div className={cn("flex flex-col gap-1", ROW_GRID)}>
                        <div className="text-[14px] font-medium text-foreground">{deployment.repo}</div>
                        <div className="text-[14px] text-(--text-secondary) min-w-0">{deployment.commitMessage}</div>
                        <div className="text-[12px] font-mono uppercase tracking-wider text-(--text-muted)">
                            {deployment.runtime}
                        </div>
                        <div className={cn("text-[12px] font-mono font-bold tracking-wider", status.className)}>
                            {status.label}
                        </div>
                    </div>
                </summary>

                <div className="px-4 pb-4 pt-4 border-t border-(--border-default) space-y-4 text-[14px] leading-relaxed text-(--text-secondary)">
                    <p>{deployment.impact}</p>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                        <div className="flex gap-2">
                            <dt className="font-mono text-(--text-muted)">Host:</dt>
                            <dd>{deployment.host}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="font-mono text-(--text-muted)">Tags:</dt>
                            <dd>{deployment.tags.join(" · ")}</dd>
                        </div>
                    </dl>

                    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-mono">
                        {deployment.liveUrl && (
                            <li>
                                <a
                                    href={deployment.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-(--accent-primary) hover:underline"
                                >
                                    {liveLabel(deployment.liveUrl)} ↗
                                </a>
                            </li>
                        )}
                        {relatedDecision && (
                            <li>
                                <Link href={`/decisions#${relatedDecision.id}`} className="text-(--accent-primary) hover:underline">
                                    ADR-{relatedDecision.number}: {relatedDecision.title}
                                </Link>
                            </li>
                        )}
                        {relatedExperiment && (
                            <li>
                                <Link href={`/experiments#${relatedExperiment.id}`} className="text-(--accent-primary) hover:underline">
                                    {relatedExperiment.id}: {relatedExperiment.title}
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </details>
        </article>
    );
}
