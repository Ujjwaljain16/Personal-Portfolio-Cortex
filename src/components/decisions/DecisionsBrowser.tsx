"use client";

import { useMemo, useState, useId } from "react";
import { Timeline } from "@/components/decisions/Timeline";
import type { Decision } from "@/data/decisions";

const ALL = "all";

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
}) {
    const id = useId();
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-label">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-11 rounded-lg border border-(--border-default) bg-(--bg-surface-1) px-3 text-[14px] text-foreground"
            >
                <option value={ALL}>All</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function DecisionsBrowser({ decisions }: { decisions: Decision[] }) {
    const [project, setProject] = useState(ALL);
    const [status, setStatus] = useState(ALL);
    const [confidence, setConfidence] = useState(ALL);

    const options = useMemo(
        () => ({
            projects: [...new Set(decisions.map((d) => d.project))].sort(),
            statuses: [...new Set(decisions.map((d) => d.status))].sort(),
            confidences: [...new Set(decisions.map((d) => d.confidence))].sort(),
        }),
        [decisions]
    );

    const visible = useMemo(
        () =>
            decisions
                .filter(
                    (d) =>
                        (project === ALL || d.project === project) &&
                        (status === ALL || d.status === status) &&
                        (confidence === ALL || d.confidence === confidence)
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [decisions, project, status, confidence]
    );

    const counts = useMemo(
        () => ({
            success: decisions.filter((d) => d.status === "success").length,
            failed: decisions.filter((d) => d.status === "failed").length,
            iterated: decisions.filter((d) => d.status === "iterated").length,
        }),
        [decisions]
    );

    return (
        <div className="space-y-6">
            <p className="font-mono text-[13px] text-(--text-secondary)">
                {decisions.length} records ·{" "}
                <span className="text-(--success)">{counts.success} succeeded</span> ·{" "}
                <span className="text-(--accent-primary)">{counts.iterated} iterated</span> ·{" "}
                <span className="text-(--danger)">{counts.failed} failed</span>
            </p>

            <form
                role="search"
                aria-label="Filter decisions"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                onSubmit={(e) => e.preventDefault()}
            >
                <FilterSelect label="Project" value={project} onChange={setProject} options={options.projects} />
                <FilterSelect label="Outcome" value={status} onChange={setStatus} options={options.statuses} />
                <FilterSelect label="Confidence" value={confidence} onChange={setConfidence} options={options.confidences} />
            </form>

            <p role="status" className="text-[13px] text-(--text-muted) font-mono">
                Showing {visible.length} of {decisions.length}
            </p>

            <Timeline decisions={visible} />
        </div>
    );
}
