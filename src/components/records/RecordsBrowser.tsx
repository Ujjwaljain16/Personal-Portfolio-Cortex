"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const ALL = "all";

/** A small labelled select, for the filters with many values (project) or few that rarely matter (provenance). */
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
        <div className="flex items-center gap-2">
            <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-9 max-w-[14rem] rounded-full border border-(--border-default) bg-(--bg-primary) px-3 text-[13px] text-foreground hover:border-(--border-hover) transition-colors"
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

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors",
                pressed
                    ? "border-(--text-primary) bg-(--text-primary) text-(--bg-primary)"
                    : "border-(--border-default) text-(--text-secondary) hover:border-(--border-hover) hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

/**
 * One entry per record: only the fields the filters need, plus the card,
 * which is rendered on the server. The record text itself never enters the
 * client bundle.
 */
export interface RecordListItem {
    id: string;
    project: string;
    outcome: string;
    provenance: string;
    featured: boolean;
    card: React.ReactNode;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function RecordsBrowser({ records }: { records: RecordListItem[] }) {
    const [project, setProject] = useState(ALL);
    const [outcome, setOutcome] = useState(ALL);
    const [provenance, setProvenance] = useState(ALL);
    const [featuredOnly, setFeaturedOnly] = useState(false);

    const options = useMemo(() => {
        const outcomes = new Map<string, number>();
        for (const r of records) outcomes.set(r.outcome, (outcomes.get(r.outcome) ?? 0) + 1);
        return {
            projects: [...new Set(records.map((r) => r.project))].sort().map((v) => ({ value: v, label: v })),
            // Most common first, so "adopted" or "confirmed" leads and the rarer outcomes follow.
            outcomes: [...outcomes.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count })),
            featured: records.filter((r) => r.featured).length,
        };
    }, [records]);

    const visible = useMemo(
        () =>
            records.filter(
                (r) =>
                    (project === ALL || r.project === project) &&
                    (outcome === ALL || r.outcome === outcome) &&
                    (provenance === ALL || r.provenance === provenance) &&
                    (!featuredOnly || r.featured),
            ),
        [records, project, outcome, provenance, featuredOnly],
    );

    const filtered = project !== ALL || outcome !== ALL || provenance !== ALL || featuredOnly;
    const reset = () => {
        setProject(ALL);
        setOutcome(ALL);
        setProvenance(ALL);
        setFeaturedOnly(false);
    };

    return (
        <div className="space-y-8">
            <form role="search" aria-label="Filter records" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Outcome">
                    <Chip
                        pressed={outcome === ALL && !featuredOnly}
                        onClick={() => {
                            setOutcome(ALL);
                            setFeaturedOnly(false);
                        }}
                    >
                        All <span className="font-mono text-[11px] opacity-70">{records.length}</span>
                    </Chip>
                    <Chip pressed={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)}>
                        Featured <span className="font-mono text-[11px] opacity-70">{options.featured}</span>
                    </Chip>
                    {options.outcomes.map((o) => (
                        <Chip key={o.value} pressed={outcome === o.value} onClick={() => setOutcome(outcome === o.value ? ALL : o.value)}>
                            {cap(o.value)} <span className="font-mono text-[11px] opacity-70">{o.count}</span>
                        </Chip>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <FilterSelect label="Project" value={project} onChange={setProject} options={options.projects} />
                    <FilterSelect
                        label="Provenance"
                        value={provenance}
                        onChange={setProvenance}
                        options={[
                            { value: "recorded", label: "Recorded at the time" },
                            { value: "reconstructed", label: "Reconstructed from history" },
                        ]}
                    />
                </div>
            </form>

            <div className="flex items-center justify-between gap-4 border-b border-(--border-default) pb-3">
                <p role="status" className="font-mono text-[12px] text-(--text-muted)">
                    Showing {visible.length} of {records.length}
                    {!filtered && " · featured first, then newest"}
                </p>
                {filtered && (
                    <button type="button" onClick={reset} className="font-mono text-[12px] text-(--accent-primary) hover:underline">
                        Clear filters
                    </button>
                )}
            </div>

            {visible.length === 0 ? (
                <p className="text-[15px] text-(--text-secondary) py-8">No records match these filters.</p>
            ) : (
                <ol className="record-list">
                    {visible.map((r) => (
                        <li key={r.id}>{r.card}</li>
                    ))}
                </ol>
            )}
        </div>
    );
}
