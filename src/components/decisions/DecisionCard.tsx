"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Decision } from "@/data/decisions";

const STATUS: Record<Decision["status"], { label: string; className: string }> = {
    success: { label: "SUCCESS", className: "text-(--success)" },
    failed: { label: "FAILED", className: "text-(--danger)" },
    iterated: { label: "ITERATED", className: "text-(--accent-primary)" },
};

const FIELDS: { key: keyof Decision; label: string }[] = [
    { key: "problem", label: "Problem" },
    { key: "constraint", label: "Constraint" },
    { key: "decision", label: "Decision" },
    { key: "alternativeRejected", label: "Rejected, and why" },
    { key: "outcome", label: "Outcome" },
];

export function DecisionCard({ decision }: { decision: Decision }) {
    const ref = useRef<HTMLDetailsElement>(null);
    const status = STATUS[decision.status];

    // Deep links: /decisions#ADR-FZ-08 opens and scrolls to that record.
    useEffect(() => {
        function openIfLinked() {
            if (window.location.hash === `#${decision.id}` && ref.current) {
                ref.current.open = true;
                ref.current.scrollIntoView({ block: "start" });
            }
        }
        openIfLinked();
        window.addEventListener("hashchange", openIfLinked);
        return () => window.removeEventListener("hashchange", openIfLinked);
    }, [decision.id]);

    return (
        <article id={decision.id} className="scroll-mt-4">
            <details ref={ref} className="disclosure surface-1 group">
                <summary className="p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-[12px] text-(--text-muted) shrink-0">
                                    ADR-{decision.number.toString().padStart(3, "0")}
                                </span>
                                <h3 className="text-[15px] font-medium text-foreground">{decision.title}</h3>
                            </div>
                            <div className="mt-1 text-[13px] text-(--text-secondary) font-mono">{decision.project}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[12px] font-mono">
                            <span className={cn("font-bold tracking-wider", status.className)}>{status.label}</span>
                            <span className="text-(--text-muted) uppercase">{decision.confidence} confidence</span>
                        </div>
                    </div>
                </summary>

                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-(--border-default)">
                    <dl className="space-y-4 pt-4">
                        {FIELDS.map(({ key, label }) => (
                            <div key={key}>
                                <dt className="text-label mb-1">{label}</dt>
                                <dd className="text-[14px] leading-relaxed text-(--text-secondary)">
                                    {String(decision[key])}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div className="flex items-center justify-between text-[12px] font-mono text-(--text-muted)">
                        <span>
                            Recorded <time dateTime={decision.date}>{decision.date}</time>
                        </span>
                        <a href={`#${decision.id}`} className="hover:text-(--accent-primary) underline underline-offset-2">
                            Link to this record
                        </a>
                    </div>
                </div>
            </details>
        </article>
    );
}
