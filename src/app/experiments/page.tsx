import { ExperimentList } from "@/components/experiments/ExperimentList";
import { experiments } from "@/data/experiments";

export default function ExperimentsPage() {
    const count = (d: string) => experiments.filter((e) => e.decision === d).length;

    return (
        <div className="space-y-6">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">EXPERIMENTS</div>
                <h1 className="text-header mb-1">Experiments</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    Engineering hypotheses tested by building the alternative: what was tried, what it replaced, and
                    whether it shipped. Open an entry to read it.
                </p>
            </header>

            <p className="font-mono text-[13px] text-(--text-secondary)">
                {experiments.length} entries · <span className="text-(--success)">{count("shipped")} shipped</span> ·{" "}
                <span className="text-(--warning)">{count("iterated")} iterated</span> ·{" "}
                <span className="text-(--danger)">{count("killed")} killed</span> ·{" "}
                <span className="text-(--accent-secondary)">{count("experimental")} experimental</span>
            </p>

            <ExperimentList />
        </div>
    );
}
