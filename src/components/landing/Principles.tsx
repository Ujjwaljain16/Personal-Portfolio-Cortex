"use client";

const PRINCIPLES = [
    "Systems over features",
    "Security as architecture, not middleware",
    "Measure before optimizing",
    "Fail visibly, iterate deliberately",
    "Ship what you can defend",
];

export function Principles() {
    return (
        <div className="space-y-2.5">
            <div className="text-label">OPERATING PRINCIPLES</div>
            <ul className="space-y-1.5">
                {PRINCIPLES.map((p) => (
                    <li
                        key={p}
                        className="text-[12px] font-mono text-(--text-secondary) flex items-center gap-2"
                    >
                        <span className="text-(--text-muted) opacity-60">•</span>
                        {p}
                    </li>
                ))}
            </ul>
        </div>
    );
}
