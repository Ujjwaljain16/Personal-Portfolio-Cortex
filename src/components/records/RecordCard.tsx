import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronDown, FileText, GitCommit, GitPullRequest, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EngineeringRecord, EvidenceType } from "@/data/records";
import { RecordDeepLink } from "@/components/records/RecordDeepLink";
import { RecordChart } from "@/components/records/RecordChart";
import { takeaway } from "@/lib/takeaway";
import { charts } from "@/data/charts";

/**
 * How a record turned out. Colour lives only in the dot, so a long list does not turn into a column of green labels;
 * `className` (coloured text) is kept for the few places that still print the label alone.
 */
export const OUTCOME: Record<string, { label: string; className: string; dot: string }> = {
    adopted: { label: "ADOPTED", className: "text-(--success)", dot: "bg-(--accent-teal)" },
    partial: { label: "PARTIAL", className: "text-(--warning)", dot: "bg-(--warning)" },
    superseded: { label: "SUPERSEDED", className: "text-(--accent-primary)", dot: "bg-(--accent-primary)" },
    reverted: { label: "REVERTED", className: "text-(--danger)", dot: "bg-(--danger)" },
    abandoned: { label: "ABANDONED", className: "text-(--danger)", dot: "bg-(--danger)" },
    rejected: { label: "REJECTED", className: "text-(--danger)", dot: "bg-(--danger)" },
    confirmed: { label: "CONFIRMED", className: "text-(--success)", dot: "bg-(--accent-teal)" },
    inconclusive: { label: "INCONCLUSIVE", className: "text-(--warning)", dot: "bg-(--warning)" },
};

export function outcomeOf(record: EngineeringRecord) {
    return OUTCOME[record.kind === "decision" ? (record.status ?? "adopted") : (record.verdict ?? "inconclusive")];
}

/** The outcome as a coloured dot and a neutral mono label. */
export function OutcomeLabel({ record, className }: { record: EngineeringRecord; className?: string }) {
    const outcome = outcomeOf(record);
    return (
        <span className={cn("inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-(--text-secondary)", className)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", outcome.dot)} aria-hidden="true" />
            {outcome.label}
        </span>
    );
}

const EVIDENCE_LABEL: Record<EvidenceType, string> = {
    commit: "commit",
    file: "file",
    pr: "pull request",
    issue: "issue",
    doc: "doc",
    benchmark: "benchmark",
    test: "test",
    release: "release",
};

const EVIDENCE_ICON: Partial<Record<EvidenceType, typeof FileText>> = {
    commit: GitCommit,
    pr: GitPullRequest,
};

/** One labelled field of an opened record: the label in a narrow column beside the text on wide screens. */
function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="record-field">
            <h3>{label}</h3>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

/**
 * One decision or investigation. Closed, it shows what it is about and how it turned out in one line; open, it shows
 * the full record with its evidence and how it was checked. Native <details>, so it works without JavaScript; a link
 * to /decisions#id opens it (RecordDeepLink).
 */
export function RecordCard({ record }: { record: EngineeringRecord }) {
    const recordCharts = charts[record.id] ?? [];

    return (
        <article id={record.id} className="record scroll-mt-6">
            <RecordDeepLink id={record.id} />
            <details className="record-details group/record">
                <summary className="record-summary">
                    <div className="min-w-0 space-y-1.5">
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11.5px] text-(--text-muted)">
                            <span>{record.project}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={record.date}>{formatDate(record.date)}</time>
                            {record.featured && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-(--accent-primary)">Featured</span>
                                </>
                            )}
                        </p>
                        <h2 className="text-[16.5px] md:text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">{record.title}</h2>
                        <p className="text-[14.5px] leading-relaxed text-(--text-secondary) line-clamp-2 group-open/record:line-clamp-none">
                            {takeaway(record)}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5 sm:flex-col sm:items-end sm:gap-2">
                        <OutcomeLabel record={record} />
                        <ChevronDown
                            className="h-4 w-4 text-(--text-muted) transition-transform group-open/record:rotate-180"
                            aria-hidden="true"
                        />
                    </div>
                </summary>

                <div className="record-body">
                    {record.kind === "decision" ? (
                        <>
                            <Field label="Context">{record.context}</Field>
                            <Field label="Decision">{record.decision}</Field>
                            {record.alternatives && record.alternatives.length > 0 && (
                                <Field label="Alternatives">
                                    <ul className="space-y-3">
                                        {record.alternatives.map((a) => (
                                            <li key={a.option}>
                                                <span className="font-medium text-foreground">{a.option}.</span> {a.whyNot}
                                            </li>
                                        ))}
                                    </ul>
                                </Field>
                            )}
                            <Field label="What happened">{record.consequences}</Field>
                        </>
                    ) : (
                        <>
                            <Field label="Question">{record.question}</Field>
                            <Field label="Method">{record.method}</Field>
                            <Field label="Result">{record.result}</Field>
                            {record.numbers && record.numbers.length > 0 && (
                                <Field label="Numbers">
                                    <dl className="record-numbers">
                                        {record.numbers.map((n) => (
                                            <div key={n.label}>
                                                <dt>
                                                    {n.label}
                                                    <span className="mt-0.5 block font-mono text-[11px] text-(--text-muted) break-all">{n.source}</span>
                                                </dt>
                                                <dd>{n.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </Field>
                            )}
                            {!record.measured && (
                                <Field label="Note">
                                    <span className="text-(--warning)">Not a measurement: this is a reproduced analysis, not a benchmark.</span>
                                </Field>
                            )}
                        </>
                    )}

                    {recordCharts.length > 0 && (
                        <Field label={recordCharts.length === 1 ? "Chart" : "Charts"}>
                            <div className="space-y-6">
                                {recordCharts.map((chart, i) => (
                                    <RecordChart key={chart.title} chart={chart} id={`${record.id}-chart-${i}`} />
                                ))}
                            </div>
                        </Field>
                    )}

                    <Field label="Evidence">
                        <ul className="space-y-3.5">
                            {record.evidence.map((e) => {
                                const Icon = EVIDENCE_ICON[e.type] ?? FileText;
                                return (
                                    <li key={`${e.type}-${e.label}-${e.note.slice(0, 20)}`} className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-(--text-muted)">
                                                {EVIDENCE_LABEL[e.type]}
                                            </span>
                                            {e.href ? (
                                                <a href={e.href} target="_blank" rel="noopener noreferrer" className="source-chip">
                                                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                    <span className="min-w-0 break-all">{e.label}</span>
                                                </a>
                                            ) : (
                                                <span className="font-mono text-[12px] text-foreground break-all">{e.label}</span>
                                            )}
                                        </div>
                                        <p className="text-[14px] leading-relaxed">{e.note}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </Field>

                    <Field label="How it was checked">
                        <p>{record.verification}</p>
                        <p className="mt-2 font-mono text-[11.5px] leading-relaxed text-(--text-muted)">
                            {record.provenance === "recorded"
                                ? "Recorded at the time (a document or commit message states it)"
                                : "Reconstructed from code and history"}
                            {" · "}
                            {record.rationaleSource === "stated" ? "reasons are stated in the repository" : "reasons are inferred"}
                            {" · "}
                            {record.dateSource}
                        </p>
                    </Field>

                    <div className="record-footer">
                        {record.projectId ? (
                            <Link href={`/projects/${record.projectId}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                                About {record.project}
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span>{record.origin}</span>
                        )}
                        <a href={`#${record.id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Link to this record
                        </a>
                    </div>
                </div>
            </details>
        </article>
    );
}
