import { cn } from "@/lib/utils";
import type { BarsChart, Chart, RangesChart, Tone } from "@/data/charts";

/**
 * Charts are plain HTML and CSS: no client JavaScript, and every value is also
 * printed as text, so nothing depends on colour or on seeing the bars.
 */

const TONE_BAR: Record<Tone, string> = {
    good: "bg-(--success)",
    bad: "bg-(--danger)",
    warn: "bg-(--warning)",
    neutral: "bg-(--accent-primary)",
};

const pct = (value: number, max: number) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

function RefLines({ refs, max }: { refs?: { value: number }[]; max: number }) {
    return (
        <>
            {refs?.map((r) => (
                <span
                    key={r.value}
                    aria-hidden="true"
                    className="absolute inset-y-0 border-l border-dashed border-(--text-muted)"
                    style={{ left: pct(r.value, max) }}
                />
            ))}
        </>
    );
}

function Legend({ refs }: { refs?: { value: number; label: string }[] }) {
    if (!refs?.length) return null;
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-(--text-secondary)">
            {refs.map((r) => (
                <li key={r.value} className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-3 border-l border-dashed border-(--text-muted)" />
                    {r.label}
                </li>
            ))}
        </ul>
    );
}

/** 0 and the axis maximum, aligned under the tracks. Decorative: every value is also printed as text. */
function Axis({ max, unit }: { max: number; unit: string }) {
    return (
        <div aria-hidden="true" className="grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <span className="hidden sm:block" />
            <div className="flex justify-between text-[11px] font-mono text-(--text-muted) border-t border-(--border-default) pt-1">
                <span>0</span>
                <span>
                    {max}
                    {unit}
                </span>
            </div>
        </div>
    );
}

function Bars({ chart }: { chart: BarsChart }) {
    return (
        <ul className="space-y-3">
            {chart.rows.map((row) => (
                <li key={row.label} className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4 sm:items-center">
                    <span className="text-[13px] text-foreground">{row.label}</span>
                    <div className="space-y-1 min-w-0">
                        <div className="relative h-5 rounded bg-(--bg-surface-3)">
                            <span
                                aria-hidden="true"
                                className={cn("absolute inset-y-0 left-0 rounded", TONE_BAR[row.tone])}
                                style={{ width: pct(row.value, chart.max) }}
                            />
                            <RefLines refs={chart.refs} max={chart.max} />
                        </div>
                        <div className="text-[12px] font-mono text-(--text-secondary) [overflow-wrap:anywhere]">
                            <span className="text-foreground">{row.display}</span>
                            {row.tag && <span> · {row.tag}</span>}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Ranges({ chart }: { chart: RangesChart }) {
    return (
        <ul className="space-y-3">
            {chart.rows.map((row) => (
                <li key={row.label} className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4 sm:items-center">
                    <span className="text-[13px] text-foreground">{row.label}</span>
                    <div className="space-y-1 min-w-0">
                        <div className="relative h-5 rounded bg-(--bg-surface-3)">
                            {chart.band && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-y-0 rounded bg-(--accent-primary)/20 border border-(--accent-primary)/40"
                                    style={{
                                        left: pct(chart.band.from, chart.max),
                                        width: pct(chart.band.to - chart.band.from, chart.max),
                                    }}
                                />
                            )}
                            <RefLines refs={chart.refs} max={chart.max} />
                            <span
                                aria-hidden="true"
                                className="absolute top-1 bottom-1 rounded bg-(--accent-primary)"
                                style={{ left: pct(row.min, chart.max), width: `max(4px, ${pct(row.max - row.min, chart.max)})` }}
                            />
                            {row.points?.map((p, i) => (
                                <span
                                    key={i}
                                    aria-hidden="true"
                                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
                                    style={{ left: pct(p, chart.max) }}
                                />
                            ))}
                        </div>
                        <div className="text-[12px] font-mono text-foreground">
                            {row.min.toFixed(2)}
                            {chart.unit} to {row.max.toFixed(2)}
                            {chart.unit}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function RecordChart({ chart, id }: { chart: Chart; id: string }) {
    const legend = chart.kind === "ranges" && chart.band ? [{ value: -1, label: `Shaded band: ${chart.band.label}.` }] : [];
    const refs = [...(chart.refs ?? [])];
    return (
        <figure aria-labelledby={`${id}-title`} className="space-y-3 rounded-lg border border-(--border-default) bg-(--bg-surface-1) p-4">
            <div>
                <h4 id={`${id}-title`} className="text-[14px] font-medium text-foreground">
                    {chart.title}
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-(--text-secondary)">{chart.caption}</p>
            </div>
            {chart.kind === "bars" ? <Bars chart={chart} /> : <Ranges chart={chart} />}
            <Axis max={chart.max} unit={chart.unit} />
            <Legend refs={refs} />
            {legend.length > 0 && <p className="text-[12px] text-(--text-secondary)">{legend[0].label}</p>}
            <figcaption className="text-[11px] font-mono leading-relaxed text-(--text-muted)">Source: {chart.source}</figcaption>
        </figure>
    );
}
