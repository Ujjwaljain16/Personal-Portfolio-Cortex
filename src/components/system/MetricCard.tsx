import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: string | number;
    hint?: string;
    href?: string;
    icon: LucideIcon;
}

export function MetricCard({ label, value, hint, href, icon: Icon }: MetricCardProps) {
    return (
        <div className="surface-1 p-4">
            <div className="flex items-start justify-between mb-2">
                <div className="text-label">{label}</div>
                <Icon className="w-4 h-4 text-(--text-muted)" aria-hidden="true" />
            </div>
            <div className="text-header text-metric">{value}</div>
            {hint &&
                (href ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-[12px] text-(--text-secondary) hover:text-(--accent-primary) line-clamp-2"
                    >
                        {hint}
                    </a>
                ) : (
                    <div className="mt-1 text-[12px] text-(--text-secondary) line-clamp-2">{hint}</div>
                ))}
        </div>
    );
}
