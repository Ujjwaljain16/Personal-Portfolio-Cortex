import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { deployments, CATEGORY_ORDER, CATEGORY_LABELS, type Deployment, type DeploymentStatus } from "@/data/deployments";
import { projects } from "@/data/projects";
import { RecordDeepLink } from "@/components/records/RecordDeepLink";

/** Colour lives only in the dot; the label stays neutral, as on the project and record pages. */
const STATUS: Record<DeploymentStatus, { label: string; dot: string }> = {
    active: { label: "LIVE", dot: "bg-(--accent-teal)" },
    device: { label: "ON DEVICE", dot: "bg-(--accent-primary)" },
    partial: { label: "FRONTEND ONLY", dot: "bg-(--warning)" },
    published: { label: "PUBLISHED", dot: "bg-(--accent-primary)" },
    library: { label: "RUNS LOCALLY", dot: "bg-(--text-muted)" },
};

function liveLabel(url: string): string {
    if (url.includes("/releases")) return "Download a release";
    if (url.includes("npmjs.com")) return "Package on npm";
    return "Open the live site";
}

/**
 * Deployment surfaces, grouped by where they run. Each row is a native <details> (keyboard and touch accessible, no
 * JavaScript). Only facts that could be checked are shown: no commit hashes, latency or uptime figures.
 */
export function DeploymentTable() {
    const groups = CATEGORY_ORDER.map((category) => ({ category, entries: deployments.filter((d) => d.category === category) })).filter(
        (g) => g.entries.length > 0,
    );

    return (
        <div className="space-y-14">
            {groups.map(({ category, entries }, i) => (
                <section
                    key={category}
                    aria-labelledby={`dep-${category}`}
                    // The first group sits under the facts strip, which already draws the line above it.
                    className={i === 0 ? "" : "border-t border-(--border-default) pt-10"}
                >
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2 id={`dep-${category}`} className="flex items-baseline gap-3 text-[21px] md:text-[23px] font-semibold tracking-[-0.02em] text-foreground">
                            <span className="font-mono text-[12px] font-normal tracking-normal text-(--text-muted)">{String(i + 1).padStart(2, "0")}</span>
                            {CATEGORY_LABELS[category]}
                        </h2>
                        <span className="font-mono text-[12px] text-(--text-muted)">
                            {entries.length} {entries.length === 1 ? "system" : "systems"}
                        </span>
                    </div>
                    <ul className="record-list is-grouped">
                        {entries.map((d) => (
                            <li key={d.id}>
                                <DeploymentRow deployment={d} />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function DeploymentRow({ deployment }: { deployment: Deployment }) {
    const status = STATUS[deployment.status];
    const project = projects.find((p) => p.name.toLowerCase() === deployment.repo.toLowerCase());

    return (
        <article id={deployment.id} className="scroll-mt-6">
            {/* /deployments#deploy-004 opens and scrolls to that row, as records do. */}
            <RecordDeepLink id={deployment.id} />
            <details className="record-details group/record">
                <summary className="record-summary">
                    <div className="min-w-0 space-y-1.5">
                        <p className="font-mono text-[11.5px] text-(--text-muted)">
                            {deployment.runtime} · {deployment.host}
                        </p>
                        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{deployment.repo}</h3>
                        <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">{deployment.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5 sm:flex-col sm:items-end sm:gap-2">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-(--text-secondary)">
                            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden="true" />
                            {status.label}
                        </span>
                        <ChevronDown className="h-4 w-4 text-(--text-muted) transition-transform group-open/record:rotate-180" aria-hidden="true" />
                    </div>
                </summary>

                <div className="record-body">
                    <div className="record-field">
                        <h4>How it runs</h4>
                        <p className="min-w-0">{deployment.impact}</p>
                    </div>
                    <div className="record-field">
                        <h4>Host</h4>
                        <p className="min-w-0">{deployment.host}</p>
                    </div>
                    <div className="record-footer">
                        {project ? (
                            <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                About {project.name}
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span>{deployment.repo}</span>
                        )}
                        {deployment.liveUrl && (
                            <a
                                href={deployment.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-(--accent-primary) hover:underline"
                            >
                                {liveLabel(deployment.liveUrl)}
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </a>
                        )}
                    </div>
                </div>
            </details>
        </article>
    );
}
