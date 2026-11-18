import Link from "next/link";
import { OutcomeLabel } from "@/components/records/RecordCard";
import { takeaway } from "@/lib/takeaway";
import type { EngineeringRecord } from "@/data/records";

export { takeaway };

/** The decisions and findings that shaped a project, each with its kind, outcome and the one-line result. */
export function RelatedRecords({ records }: { records: EngineeringRecord[] }) {
    return (
        <ul className="divide-y divide-(--border-default)">
            {records.map((r) => (
                <li key={r.id} className="group relative py-5 first:pt-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">
                            {r.kind === "decision" ? "Decision" : "Investigation"}
                        </span>
                        <OutcomeLabel record={r} />
                    </p>
                    <Link
                        href={`/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}`}
                        className="mt-2 block text-[16px] font-medium leading-snug text-foreground group-hover:text-(--accent-primary) after:absolute after:inset-0 after:content-[''] transition-colors"
                    >
                        {r.title}
                    </Link>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-(--text-secondary)">{takeaway(r)}</p>
                </li>
            ))}
        </ul>
    );
}
