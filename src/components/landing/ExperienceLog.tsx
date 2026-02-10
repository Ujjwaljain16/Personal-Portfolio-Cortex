"use client";

interface ExperienceEntry {
    role: string;
    org: string;
    period: string;
    focus: string;
    impact: string;
    stack: string;
}

const EXPERIENCE: ExperienceEntry[] = [
    {
        role: "Backend & AI Infrastructure Engineer",
        org: "Independent — Open Source",
        period: "2023 — Present",
        focus: "AI Safety Infrastructure, Multi-tenant SaaS, Distributed Event-Driven Systems",
        impact: "Built AgentBrake (MCP proxy firewall for AI agents), CampusSync (verifiable credential platform), and an E-commerce backend with gRPC + Kafka pipelines",
        stack: "TypeScript · Go · Python · Next.js · PostgreSQL · Redis · Docker · Kubernetes",
    },
    {
        role: "Full-Stack Systems Developer",
        org: "Project-based Engineering",
        period: "2022 — 2023",
        focus: "Security Architecture, Real-time Data Pipelines, Developer Tooling",
        impact: "Shipped migrateDB (npm package — dependency-aware migration engine), SheetSync ETL pipeline, and HttpServer from raw sockets with observability",
        stack: "React · Node.js · Supabase · gRPC · GraphQL · Python · Sockets",
    },
];

export function ExperienceLog() {
    return (
        <div className="space-y-4 mt-10">
            <div className="text-label">EXPERIENCE</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-(--text-muted) opacity-50 font-mono -mt-1">ENGINEERING LOG</div>
            <div className="space-y-3">
                {EXPERIENCE.map((entry) => (
                    <div
                        key={entry.role}
                        className="surface-1 rounded-lg p-4 space-y-1.5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-[14px] font-medium text-foreground">
                                {entry.role}
                                <span className="text-(--text-muted) font-normal">
                                    {" "}— {entry.org}
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-(--accent-primary) whitespace-nowrap shrink-0">
                                {entry.period}
                            </span>
                        </div>
                        <div className="text-[12px] text-(--text-secondary)">
                            Focus: {entry.focus}
                        </div>
                        <div className="text-[12px] text-(--text-secondary) leading-relaxed">
                            {entry.impact}
                        </div>
                        <div className="text-[11px] font-mono text-(--text-muted)">
                            {entry.stack}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
