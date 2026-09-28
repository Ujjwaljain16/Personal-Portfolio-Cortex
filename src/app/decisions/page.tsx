import { DecisionsBrowser } from "@/components/decisions/DecisionsBrowser";
import { decisions } from "@/data/decisions";

export default function DecisionsPage() {
    return (
        <div className="space-y-6">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">DECISIONS</div>
                <h1 className="text-header mb-1">Decisions</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    Engineering decisions with the problem, the constraint, the alternative I rejected and what actually
                    happened, including the ones that failed. Open a record to read it; each has a stable link.
                </p>
            </header>
            <DecisionsBrowser decisions={decisions} />
        </div>
    );
}
