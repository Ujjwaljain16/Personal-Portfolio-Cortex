import type { Diagram as DiagramData } from "@/data/diagrams";

/**
 * A pipeline diagram as an ordered list. It is real text (so it reads well with a
 * screen reader and without CSS); the boxes, numbers and arrows are decoration.
 */
export function Diagram({ id, diagram }: { id: string; diagram: DiagramData }) {
    return (
        <figure aria-labelledby={`${id}-caption`} className="space-y-3">
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
                {diagram.steps.map((step, i) => (
                    <li key={step.title} className="relative surface-1 p-3 flex flex-col gap-1.5">
                        <span className="font-mono text-[11px] text-(--accent-primary)" aria-hidden="true">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] font-medium leading-snug text-foreground">{step.title}</span>
                        <span className="text-[12px] leading-relaxed text-(--text-secondary)">{step.detail}</span>
                        {i < diagram.steps.length - 1 && (
                            <span
                                aria-hidden="true"
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[12px] leading-none text-(--text-muted) sm:hidden"
                            >
                                ↓
                            </span>
                        )}
                    </li>
                ))}
            </ol>
            <figcaption id={`${id}-caption`} className="text-[12px] font-mono leading-relaxed text-(--text-muted)">
                {diagram.caption}
            </figcaption>
        </figure>
    );
}
