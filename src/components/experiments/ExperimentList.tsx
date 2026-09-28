import Link from "next/link";
import { cn } from "@/lib/utils";
import { experiments, type Experiment } from "@/data/experiments";
import { decisions } from "@/data/decisions";
import { deployments } from "@/data/deployments";

const VERDICT_COLOR: Record<Experiment["decision"], string> = {
    shipped: "text-(--success)",
    killed: "text-(--danger)",
    experimental: "text-(--accent-secondary)",
    iterated: "text-(--warning)",
};

export function ExperimentList() {
    return (
        <ul className="space-y-3">
            {experiments.map((experiment) => (
                <li key={experiment.id}>
                    <ExperimentRow experiment={experiment} />
                </li>
            ))}
        </ul>
    );
}

function ExperimentRow({ experiment }: { experiment: Experiment }) {
    const linkedDecision = experiment.linkedDecisionId
        ? decisions.find((d) => d.id === experiment.linkedDecisionId)
        : undefined;
    const linkedDeployment = deployments.find((d) => d.relatedExperimentId === experiment.id);
    const killed = experiment.decision === "killed";

    return (
        <article id={experiment.id} className="scroll-mt-4">
            <details className="disclosure surface-1">
                <summary className="p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-[12px] text-(--text-muted) shrink-0">{experiment.id}</span>
                                <h3 className="text-[15px] font-medium text-foreground">{experiment.title}</h3>
                            </div>
                            <div className="mt-1 text-[13px] text-(--text-secondary) font-mono">
                                {experiment.project} · {experiment.category}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "shrink-0 text-[12px] font-mono font-bold tracking-wider uppercase",
                                VERDICT_COLOR[experiment.decision]
                            )}
                        >
                            {experiment.decision}
                        </span>
                    </div>
                </summary>

                <div className="px-4 pb-4 border-t border-(--border-default) space-y-5 pt-4 text-[14px] leading-relaxed text-(--text-secondary)">
                    <div>
                        <h4 className="text-label mb-1">Hypothesis</h4>
                        <p>{experiment.hypothesis}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-(--border-default) bg-(--bg-surface-2) p-3">
                            <h4 className="text-label mb-1">Control</h4>
                            <p>{experiment.variants.control}</p>
                        </div>
                        <div
                            className={cn(
                                "rounded-lg border bg-(--bg-surface-2) p-3",
                                killed ? "border-(--danger)/40" : "border-(--accent-primary)/40"
                            )}
                        >
                            <h4 className="text-label mb-1">Variant</h4>
                            <p>{experiment.variants.variant}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-label mb-1">{killed ? "Outcome" : "Impact"}</h4>
                        <p>{experiment.impact}</p>
                    </div>

                    {killed && (experiment.reasonKilled || experiment.lesson) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {experiment.reasonKilled && (
                                <div>
                                    <h4 className="text-label mb-1">Why it was killed</h4>
                                    <p>{experiment.reasonKilled}</p>
                                </div>
                            )}
                            {experiment.lesson && (
                                <div>
                                    <h4 className="text-label mb-1">Lesson</h4>
                                    <p>{experiment.lesson}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <h4 className="text-label mb-1">Signals</h4>
                        <ul className="list-disc pl-5 space-y-0.5">
                            {experiment.signals.map((s) => (
                                <li key={s}>{s}</li>
                            ))}
                        </ul>
                    </div>

                    {(experiment.evidence || experiment.notes) && (
                        <div className="space-y-2 text-[13px]">
                            {experiment.evidence && (
                                <p>
                                    <span className="font-mono text-(--text-muted)">Evidence: </span>
                                    {experiment.evidence}
                                </p>
                            )}
                            {experiment.notes && (
                                <p>
                                    <span className="font-mono text-(--text-muted)">Notes: </span>
                                    {experiment.notes}
                                </p>
                            )}
                        </div>
                    )}

                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] font-mono text-(--text-muted)">
                        <div className="flex gap-1">
                            <dt>Risk:</dt>
                            <dd className="text-(--text-secondary)">{experiment.riskLevel}</dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>Surface:</dt>
                            <dd className="text-(--text-secondary)">{experiment.surfaceArea}</dd>
                        </div>
                        {linkedDecision && (
                            <div className="flex gap-1">
                                <dt>Decision:</dt>
                                <dd>
                                    <Link
                                        href={`/decisions#${linkedDecision.id}`}
                                        className="text-(--accent-primary) hover:underline"
                                    >
                                        ADR-{linkedDecision.number}
                                    </Link>
                                </dd>
                            </div>
                        )}
                        {linkedDeployment && (
                            <div className="flex gap-1">
                                <dt>Deployment:</dt>
                                <dd>
                                    <Link href="/deployments" className="text-(--accent-primary) hover:underline">
                                        {linkedDeployment.repo}
                                    </Link>
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </details>
        </article>
    );
}
