import type { ReactNode } from "react";

/** A home-page section title: a small numbered kicker, the heading, and an optional one-paragraph lead. */
export function SectionHeading({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
    return (
        <div className="space-y-2">
            <p className="section-kicker">{kicker}</p>
            <h2 id={id} className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {title}
            </h2>
            {children && <p className="text-[15px] leading-relaxed text-(--text-secondary) max-w-2xl">{children}</p>}
        </div>
    );
}
