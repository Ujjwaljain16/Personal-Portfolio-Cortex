import { DecisionCard } from "@/components/decisions/DecisionCard";
import type { Decision } from "@/data/decisions";

/** Newest-first list of decision records on a subtle vertical rail. */
export function Timeline({ decisions }: { decisions: Decision[] }) {
    if (decisions.length === 0) {
        return <p className="text-[14px] text-(--text-secondary) py-8">No decisions match these filters.</p>;
    }

    return (
        <ol className="space-y-3 border-l border-(--border-default) pl-4 sm:pl-6">
            {decisions.map((decision) => (
                <li key={decision.id} className="relative">
                    <span
                        aria-hidden="true"
                        className="absolute -left-[calc(1rem+3px)] sm:-left-[calc(1.5rem+3px)] top-6 w-1.5 h-1.5 rounded-full bg-(--border-hover)"
                    />
                    <DecisionCard decision={decision} />
                </li>
            ))}
        </ol>
    );
}
