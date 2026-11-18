import { cn } from "@/lib/utils";
import { STATUS_LABEL, type ProjectStatus } from "@/data/projects";

/** Colour lives only in the dot; the label stays neutral, so a row of statuses never turns into a row of badges. */
const DOT: Record<ProjectStatus, string> = {
    ongoing: "bg-(--accent-teal)",
    shipped: "bg-(--accent-primary)",
    prototype: "bg-(--text-muted)",
    "in-progress": "bg-(--warning)",
};

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border border-(--border-default) px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-(--text-secondary)",
                className,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} aria-hidden="true" />
            {STATUS_LABEL[status]}
        </span>
    );
}
