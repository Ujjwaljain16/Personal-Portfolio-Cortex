import Link from "next/link";
import { cn } from "@/lib/utils";
import { OUTCOME } from "@/components/records/RecordCard";
import type { EngineeringRecord } from "@/data/records";

/** The first sentence of a record's outcome, trimmed to a readable length. */
export function takeaway(r: EngineeringRecord): string {
    const text = (r.kind === "decision" ? r.consequences : r.result) ?? "";
    const first = text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0]?.trim() ?? "";
    if (first.length <= 220) return first;
    const cut = first.slice(0, 217);
    return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

/** The decisions and findings that shaped a project, each with its outcome and the one-line result. */
export function RelatedRecords({ records }: { records: EngineeringRecord[] }) {
    return (
        <ul className="space-y-4">
            {records.map((r) => {
                const outcome = OUTCOME[r.kind === "decision" ? (r.status ?? "adopted") : (r.verdict ?? "inconclusive")];
                return (
                    <li key={r.id} className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <Link
                                href={`/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}`}
                                className="text-[15px] font-medium text-(--accent-primary) hover:underline"
                            >
                                {r.title}
                            </Link>
                            <span className={cn("shrink-0 text-[11px] font-mono font-bold tracking-wider", outcome.className)}>
                                {outcome.label}
                            </span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-(--text-secondary)">{takeaway(r)}</p>
                    </li>
                );
            })}
        </ul>
    );
}
