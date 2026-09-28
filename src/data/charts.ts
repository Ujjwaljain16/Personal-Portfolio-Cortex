/**
 * Charts for records whose numbers are worth seeing. Each value is copied from
 * the record it belongs to (or computed from figures in it), and `source` says
 * where it came from. A chart never adds a measurement the record does not have.
 */

export type Tone = "good" | "bad" | "warn" | "neutral";

interface Ref {
    value: number;
    label: string;
}

export interface BarsChart {
    kind: "bars";
    title: string;
    caption: string;
    unit: string;
    max: number;
    rows: { label: string; value: number; display: string; tag?: string; tone: Tone }[];
    refs?: Ref[];
    source: string;
}

export interface RangesChart {
    kind: "ranges";
    title: string;
    caption: string;
    unit: string;
    max: number;
    /** A shaded band, such as a target. */
    band?: { from: number; to: number; label: string };
    rows: { label: string; min: number; max: number; points?: number[] }[];
    refs?: Ref[];
    source: string;
}

export type Chart = BarsChart | RangesChart;

export const charts: Record<string, Chart[]> = {
    "minidb-volcano-vs-vectorized-benchmark": [
        {
            kind: "ranges",
            title: "Vectorized speedup over Volcano, by table size",
            caption: "Five independent runs of the unmodified benchmark script. Each bar spans the lowest to the highest speedup seen.",
            unit: "x",
            max: 10,
            band: { from: 5, to: 10, label: "the stated goal of 5-10x" },
            rows: [
                { label: "10,000 rows", min: 1.48, max: 2.22 },
                { label: "50,000 rows", min: 1.12, max: 1.35 },
                { label: "100,000 rows", min: 1.02, max: 1.32 },
            ],
            source: "npx tsx benchmarks/volcano_vs_vectorized.ts, five runs (see the numbers above)",
        },
        {
            kind: "ranges",
            title: "The same 100,000-row query with parts of the engine switched off",
            caption: "Volcano time divided by vectorized time, three runs per variant. Dots are single runs.",
            unit: "x",
            max: 2,
            refs: [{ value: 1, label: "1x: no speedup" }],
            rows: [
                { label: "Default", min: 1.21, max: 1.22, points: [1.21, 1.22, 1.21] },
                { label: "Per-row tracking off", min: 0.95, max: 1.17, points: [1.01, 0.95, 1.17] },
                { label: "Row locks stubbed out", min: 1.64, max: 1.91, points: [1.64, 1.91, 1.74] },
                { label: "Locks stubbed and tracking off", min: 1.14, max: 1.43, points: [1.33, 1.43, 1.14] },
            ],
            source: "Ratios computed from the millisecond figures of the four ablation runs listed in the numbers above",
        },
    ],
    "classifier-thresholds-calibrated-to-six": [
        {
            kind: "bars",
            title: "P99 latency and failure label for six routing policies",
            caption: "One scenario: 5 targets, capacity 1, a flash-crowd workload, seeds 17000-17002. Lower is better, and the label is what the classifier says.",
            unit: "s",
            max: 5,
            rows: [
                { label: "Weighted round-robin", value: 1.21, display: "1.21 s", tag: "ACUTE_COLLAPSE · committed work 163", tone: "bad" },
                { label: "Least connections", value: 2.49, display: "2.49 s", tag: "STABLE · committed work 8", tone: "good" },
                { label: "Power of two choices", value: 2.68, display: "2.68 s", tag: "STABLE · committed work 4", tone: "good" },
                { label: "Adaptive", value: 2.88, display: "2.88 s", tag: "ACUTE_COLLAPSE · committed work 71", tone: "bad" },
                { label: "Round-robin", value: 3.76, display: "3.76 s", tag: "CHRONIC_COLLAPSE · committed work 4", tone: "warn" },
                { label: "EWMA", value: 4.4, display: "4.40 s", tag: "ACUTE_COLLAPSE · committed work 97", tone: "bad" },
            ],
            source: "P99 read from the dashboard's Compare tab; labels and committed work re-run from the report command in a clone",
        },
    ],
    "spentsmart-apk-size-across-releases": [
        {
            kind: "bars",
            title: "Release APK size against the documented reduction",
            caption: "The docs claim the app went from 45 MB to about 15 MB. The published release files do not show a reduction.",
            unit: "MB",
            max: 140,
            refs: [
                { value: 15, label: "Documented size after the change: about 15 MB" },
                { value: 45, label: "Documented size before: 45 MB" },
            ],
            rows: [
                { label: "v1.0.0", value: 115.96, display: "115.96 MB", tone: "neutral" },
                { label: "v2.0.0", value: 126.79, display: "126.79 MB", tag: "+9.33% vs v1.0.0", tone: "bad" },
                { label: "v2.01", value: 126.77, display: "126.77 MB", tag: "+9.32% vs v1.0.0", tone: "bad" },
            ],
            source: "GitHub releases API, asset sizes in bytes divided by 1,000,000",
        },
    ],
};
