"use client";

const SKILL_GROUPS = [
    {
        label: "Languages",
        skills: ["TypeScript", "Go", "Python", "Java", "SQL"],
    },
    {
        label: "Backend",
        skills: ["Node.js", "Express", "gRPC", "GraphQL", "Kafka", "Redis"],
    },
    {
        label: "Databases",
        skills: ["PostgreSQL", "MySQL", "SQLite", "pgvector", "Supabase"],
    },
    {
        label: "Infrastructure",
        skills: ["Docker", "Kubernetes", "CI/CD", "Prometheus", "Nginx"],
    },
    {
        label: "Frontend",
        skills: ["React", "Next.js", "Tailwind CSS", "React Native"],
    },
    {
        label: "AI / ML",
        skills: ["Gemini API", "LangChain", "Embeddings", "MCP Protocol"],
    },
];

export function SkillsGrid() {
    return (
        <div className="space-y-3 mt-10">
            <div className="text-label">TECH STACK</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SKILL_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-(--text-muted) opacity-60 font-mono">
                            {group.label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {group.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="text-[10px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono tech-tag"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
