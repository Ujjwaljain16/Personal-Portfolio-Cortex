"use client";

import { Timeline } from "@/components/decisions/Timeline";
import { decisions } from "@/data/decisions";
import { useEffect, useMemo } from "react";
import { useSystemStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Hash, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DecisionsPage() {
    const setSelectedDecision = useSystemStore((s) => s.setSelectedDecision);
    const setContextContent = useSystemStore((s) => s.setContextContent);

    // Reset selection on mount — ContextPanel shows its own empty state via MODULE_CONFIG
    useEffect(() => {
        setSelectedDecision(null);
        setContextContent(null);
    }, [setSelectedDecision, setContextContent]);

    const stats = useMemo(() => [
        { label: "Total", value: decisions.length, icon: Hash },
        { label: "Success", value: decisions.filter((d) => d.status === "success").length, icon: CheckCircle2, color: "text-(--success)" as const },
        { label: "Failed", value: decisions.filter((d) => d.status === "failed").length, icon: XCircle, color: "text-(--danger)" as const },
        { label: "Iterated", value: decisions.filter((d) => d.status === "iterated").length, icon: RefreshCw, color: "text-(--warning)" as const },
    ], []);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">DECISIONS</div>
                <h1 className="text-header mb-1">Decisions</h1>
                <p className="text-sm text-(--text-secondary)">
                    Architectural and product decisions with documented reasoning
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <StatCard key={stat.label} {...stat} delay={idx * 0.08} />
                ))}
            </div>

            {/* Timeline */}
            <Timeline decisions={decisions} />
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    delay = 0,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color?: string;
    delay?: number;
}) {
    return (
        <motion.div
            className="surface-1 surface-interactive p-4 relative overflow-hidden group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="text-label">{label}</div>
                <Icon className={cn(
                    "w-4 h-4 transition-colors",
                    color || "text-(--text-muted) group-hover:text-(--accent-primary)"
                )} />
            </div>
            <div className={cn("text-header text-metric", color || "text-foreground")}>
                {value}
            </div>
        </motion.div>
    );
}
