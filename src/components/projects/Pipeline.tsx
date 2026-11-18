import { cn } from "@/lib/utils";
import type { DiagramStep } from "@/data/diagrams";

/**
 * A project's architecture as a vertical, numbered pipeline: the same steps its diagram data holds. It is a real ordered
 * list, so it reads in order with a screen reader; the rail and numbered nodes are decoration.
 * `compact` (home cards) keeps each detail to one line; the project page shows them in full.
 */
export function Pipeline({ steps, compact = false, className }: { steps: DiagramStep[]; compact?: boolean; className?: string }) {
    return (
        <ol className={cn("pipeline relative w-full", compact ? "space-y-4" : "space-y-6", className)}>
            {(compact ? steps.slice(0, 5) : steps).map((step, i) => (
                <li key={step.title} className="relative flex items-start gap-3.5">
                    <span className="pipeline-node" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 pt-[5px]">
                        <span className={cn("block font-medium text-foreground leading-snug", compact ? "text-[13.5px]" : "text-[15px]")}>
                            {step.title}
                        </span>
                        <span
                            className={cn(
                                "block text-(--text-muted)",
                                compact ? "text-[12.5px] leading-snug line-clamp-1" : "mt-0.5 text-[14px] leading-relaxed",
                            )}
                        >
                            {step.detail}
                        </span>
                    </span>
                </li>
            ))}
        </ol>
    );
}
