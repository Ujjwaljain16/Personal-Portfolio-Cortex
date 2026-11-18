import { cn } from "@/lib/utils";
import { AREA_LABEL, type ProjectArea } from "@/data/projects";

/** A project's areas as a quiet mono line ("AI · Full-stack"): a label, not a button. */
export function AreaTags({ areas, className }: { areas: ProjectArea[]; className?: string }) {
    return (
        <span className={cn("font-mono text-[11px] uppercase tracking-[0.12em] text-(--text-muted)", className)}>
            {areas.map((a) => AREA_LABEL[a]).join(" · ")}
        </span>
    );
}
