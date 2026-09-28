import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EngineeringRecord, EvidenceType } from "@/data/records";
import { RecordDeepLink } from "@/components/records/RecordDeepLink";

const OUTCOME: Record<string, { label: string; className: string }> = {
    adopted: { label: "ADOPTED", className: "text-(--success)" },
    partial: { label: "PARTIAL", className: "text-(--warning)" },
    superseded: { label: "SUPERSEDED", className: "text-(--accent-primary)" },
    reverted: { label: "REVERTED", className: "text-(--danger)" },
    abandoned: { label: "ABANDONED", className: "text-(--danger)" },
    rejected: { label: "REJECTED", className: "text-(--danger)" },
    confirmed: { label: "CONFIRMED", className: "text-(--success)" },
    inconclusive: { label: "INCONCLUSIVE", className: "text-(--warning)" },
};

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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-label mb-1">{label}</h3>
            <div className="text-[14px] leading-relaxed text-(--text-secondary)">{children}</div>
        </div>
    );
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

export function RecordCard({ record }: { record: EngineeringRecord }) {
    const outcome = OUTCOME[record.kind === "decision" ? (record.status ?? "adopted") : (record.verdict ?? "inconclusive")];

    return (
        <article id={record.id} className="scroll-mt-4">
            <RecordDeepLink id={record.id} />
            <details className="disclosure surface-1">
                <summary className="p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-mono text-(--text-muted)">
                                <span>{record.project}</span>
                                <span aria-hidden="true">·</span>
                                <time dateTime={record.date}>{formatDate(record.date)}</time>
                                {record.featured && (
                                    <span className="badge badge-info ml-1" title="One of the strongest records">
                                        FEATURED
                                    </span>
                                )}
                            </div>
                            <h2 className="mt-1 text-[16px] font-medium text-foreground">{record.title}</h2>
                        </div>
                        <span className={cn("shrink-0 text-[12px] font-mono font-bold tracking-wider", outcome.className)}>
                            {outcome.label}
                        </span>
                    </div>
                </summary>

                <div className="px-4 pb-5 pt-4 border-t border-(--border-default) space-y-5">
                    {record.kind === "decision" ? (
                        <>
                            <Section label="Context">{record.context}</Section>
                            <Section label="Decision">{record.decision}</Section>
                            {record.alternatives && record.alternatives.length > 0 && (
                                <Section label="Alternatives considered">
                                    <ul className="space-y-3">
                                        {record.alternatives.map((a) => (
                                            <li key={a.option}>
                                                <span className="text-foreground">{a.option}.</span> {a.whyNot}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                            <Section label="What happened">{record.consequences}</Section>
                        </>
                    ) : (
                        <>
                            <Section label="Question">{record.question}</Section>
                            <Section label="Method">{record.method}</Section>
                            <Section label="Result">{record.result}</Section>
                            {record.numbers && record.numbers.length > 0 && (
                                <div>
                                    <h3 className="text-label mb-2">Numbers</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 text-[13px]">
                                        {record.numbers.map((n) => (
                                            <div key={n.label} className="contents">
                                                <dt className="text-(--text-secondary)">
                                                    {n.label}
                                                    <span className="block font-mono text-[11px] text-(--text-muted) break-all">{n.source}</span>
                                                </dt>
                                                <dd className="font-mono text-foreground sm:text-right">{n.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            )}
                            {!record.measured && (
                                <p className="text-[13px] text-(--warning)">
                                    Not a measurement: this is a reproduced analysis, not a benchmark.
                                </p>
                            )}
                        </>
                    )}

                    <div>
                        <h3 className="text-label mb-2">Evidence</h3>
                        <ul className="space-y-2 text-[13px] leading-relaxed">
                            {record.evidence.map((e) => (
                                <li key={`${e.type}-${e.label}-${e.note.slice(0, 20)}`} className="text-(--text-secondary)">
                                    <span className="font-mono text-[11px] uppercase tracking-wider text-(--text-muted) mr-2">
                                        {EVIDENCE_LABEL[e.type]}
                                    </span>
                                    {e.href ? (
                                        <a
                                            href={e.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-(--accent-primary) hover:underline break-all"
                                        >
                                            {e.label} ↗
                                        </a>
                                    ) : (
                                        <span className="font-mono text-foreground break-all">{e.label}</span>
                                    )}
                                    <span className="block sm:inline sm:ml-2">{e.note}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-lg border border-(--border-default) bg-(--bg-surface-2) p-3 text-[13px] leading-relaxed text-(--text-secondary) space-y-1.5">
                        <p>
                            <span className="font-mono text-(--text-muted)">How this was checked: </span>
                            {record.verification}
                        </p>
                        <p className="font-mono text-[12px] text-(--text-muted)">
                            {record.provenance === "recorded"
                                ? "Recorded at the time (a document or commit message states it)"
                                : "Reconstructed from code and history"}
                            {" · "}
                            {record.rationaleSource === "stated" ? "reasons are stated in the repository" : "reasons are inferred"}
                            {" · "}
                            {record.dateSource}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] font-mono text-(--text-muted)">
                        {record.projectId ? (
                            <Link href={`/projects/${record.projectId}`} className="hover:text-(--accent-primary) underline underline-offset-2">
                                About {record.project}
                            </Link>
                        ) : (
                            <span>{record.origin}</span>
                        )}
                        <a href={`#${record.id}`} className="hover:text-(--accent-primary) underline underline-offset-2">
                            Link to this record
                        </a>
                    </div>
                </div>
            </details>
        </article>
    );
}
