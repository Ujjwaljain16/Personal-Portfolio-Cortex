import type { ReactNode } from "react";

/** The header of /decisions and /investigations: kicker, title, lead, and a strip of counts taken from the records. */
export function RecordsHeader({
    kicker,
    title,
    children,
    facts,
}: {
    kicker: string;
    title: string;
    children: ReactNode;
    facts: { label: string; value: string | number; note?: ReactNode }[];
}) {
    return (
        <header className="space-y-10 pt-2">
            <div className="space-y-5">
                <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">{kicker}</p>
                <h1 className="text-[2.5rem] leading-[1.05] md:text-[3.25rem] font-semibold tracking-[-0.035em] text-foreground">{title}</h1>
                <div className="max-w-[44rem] text-[17px] md:text-[18px] leading-[1.6] text-(--text-secondary)">{children}</div>
            </div>
            <dl className="facts-strip grid grid-cols-2 lg:grid-cols-4">
                {facts.map((f) => (
                    <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>
                            <span className="metric-value block text-[22px] leading-tight">{f.value}</span>
                            {f.note && <span className="mt-1.5 block text-[13px] leading-relaxed text-(--text-secondary)">{f.note}</span>}
                        </dd>
                    </div>
                ))}
            </dl>
        </header>
    );
}
