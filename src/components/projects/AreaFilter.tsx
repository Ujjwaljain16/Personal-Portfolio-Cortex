"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The area filter on /projects. The list itself is rendered on the server; this hides the items whose data-areas does
 * not include the chosen area, updates each section's count, and hides a section left empty. The choice is kept in the
 * URL (?area=ai) so a filtered view can be shared. Without JavaScript nothing is hidden.
 */
export function AreaFilter({ areas, total }: { areas: { id: string; label: string; count: number }[]; total: number }) {
    const [active, setActive] = useState<string | null>(null);

    const apply = useCallback((area: string | null) => {
        for (const section of document.querySelectorAll<HTMLElement>("[data-filter-section]")) {
            const items = [...section.querySelectorAll<HTMLElement>("[data-areas]")];
            let shown = 0;
            for (const item of items) {
                const match = !area || (item.dataset.areas ?? "").split(" ").includes(area);
                item.hidden = !match;
                if (match) shown++;
            }
            // Sections without tagged items (Also built) only show when nothing is filtered.
            section.hidden = area ? shown === 0 : false;
            const count = section.querySelector<HTMLElement>("[data-filter-count]");
            if (count && items.length) count.textContent = `${shown} ${shown === 1 ? "project" : "projects"}`;
        }
    }, []);

    // Pick up ?area= on load (also after back and forward).
    useEffect(() => {
        const read = () => {
            const fromUrl = new URLSearchParams(window.location.search).get("area");
            const valid = areas.some((a) => a.id === fromUrl) ? fromUrl : null;
            setActive(valid);
            apply(valid);
        };
        read();
        window.addEventListener("popstate", read);
        return () => window.removeEventListener("popstate", read);
    }, [areas, apply]);

    const choose = (area: string | null) => {
        setActive(area);
        apply(area);
        const url = new URL(window.location.href);
        if (area) url.searchParams.set("area", area);
        else url.searchParams.delete("area");
        window.history.replaceState(null, "", url);
    };

    const chip = (id: string | null, label: string, count: number) => (
        <li key={id ?? "all"}>
            <button
                type="button"
                aria-pressed={active === id}
                onClick={() => choose(id)}
                className={cn(
                    "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors",
                    active === id
                        ? "border-(--text-primary) bg-(--text-primary) text-(--bg-primary)"
                        : "border-(--border-default) text-(--text-secondary) hover:border-(--border-hover) hover:text-foreground",
                )}
            >
                {label}
                <span className={cn("font-mono text-[11px]", active === id ? "opacity-70" : "text-(--text-muted)")}>{count}</span>
            </button>
        </li>
    );

    return (
        <nav aria-label="Filter projects by area">
            <ul className="flex flex-wrap gap-2">
                {chip(null, "All", total)}
                {areas.map((a) => chip(a.id, a.label, a.count))}
            </ul>
        </nav>
    );
}
