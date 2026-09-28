"use client";

import { useId, useMemo, useState } from "react";
import { RecordCard } from "@/components/records/RecordCard";
import type { EngineeringRecord } from "@/data/records";

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
    options: { value: string; label: string }[];
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
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

const outcomeOf = (r: EngineeringRecord) => (r.kind === "decision" ? r.status : r.verdict) ?? "adopted";

export function RecordsBrowser({ records }: { records: EngineeringRecord[] }) {
    const [project, setProject] = useState(ALL);
    const [outcome, setOutcome] = useState(ALL);
    const [provenance, setProvenance] = useState(ALL);

    const options = useMemo(
        () => ({
            projects: [...new Set(records.map((r) => r.project))].sort().map((v) => ({ value: v, label: v })),
            outcomes: [...new Set(records.map(outcomeOf))].sort().map((v) => ({ value: v, label: v })),
        }),
        [records]
    );

    const visible = useMemo(
        () =>
            records.filter(
                (r) =>
                    (project === ALL || r.project === project) &&
                    (outcome === ALL || outcomeOf(r) === outcome) &&
                    (provenance === ALL || r.provenance === provenance)
            ),
        [records, project, outcome, provenance]
    );

    return (
        <div className="space-y-6">
            <form
                role="search"
                aria-label="Filter records"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                onSubmit={(e) => e.preventDefault()}
            >
                <FilterSelect label="Project" value={project} onChange={setProject} options={options.projects} />
                <FilterSelect label="Outcome" value={outcome} onChange={setOutcome} options={options.outcomes} />
                <FilterSelect
                    label="Provenance"
                    value={provenance}
                    onChange={setProvenance}
                    options={[
                        { value: "recorded", label: "Recorded at the time" },
                        { value: "reconstructed", label: "Reconstructed from history" },
                    ]}
                />
            </form>

            <p role="status" className="text-[13px] text-(--text-muted) font-mono">
                Showing {visible.length} of {records.length}
            </p>

            {visible.length === 0 ? (
                <p className="text-[14px] text-(--text-secondary) py-8">No records match these filters.</p>
            ) : (
                <ol className="space-y-3">
                    {visible.map((r) => (
                        <li key={r.id}>
                            <RecordCard record={r} />
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
