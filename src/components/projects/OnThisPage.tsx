"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The project page's contents, kept beside the text on wide screens. It marks the section being read: inner pages
 * scroll inside .main-panel, not the window, so that panel is the observer's root. Without JavaScript it is still a
 * plain list of in-page links.
 */
export function OnThisPage({ items }: { items: { id: string; label: string }[] }) {
    const [active, setActive] = useState(items[0]?.id);
    const ids = items.map((i) => i.id).join(",");

    useEffect(() => {
        const root = document.querySelector(".main-panel");
        const sections = ids
            .split(",")
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => !!el);
        if (!sections.length) return;
        // A section counts as being read once its top passes the upper third of the panel.
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { root, rootMargin: "0px 0px -66% 0px", threshold: 0 },
        );
        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, [ids]);

    return (
        <nav aria-label="On this page" className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted)">On this page</p>
            <ul className="border-l border-(--border-default)">
                {items.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            aria-current={active === item.id ? "location" : undefined}
                            className={cn(
                                "-ml-px block border-l py-1.5 pl-4 text-[13px] leading-snug transition-colors",
                                active === item.id
                                    ? "border-(--accent-primary) text-foreground"
                                    : "border-transparent text-(--text-muted) hover:text-(--text-secondary)",
                            )}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
