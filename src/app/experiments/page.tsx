"use client";

import { ExperimentList } from "@/components/experiments/ExperimentList";
import { MetricsChart } from "@/components/experiments/MetricsChart";
import { useEffect, useMemo } from "react";
import { useSystemStore } from "@/lib/store";
import { motion } from "framer-motion";
import { FlaskConical, CheckCircle2, XCircle, RefreshCw, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";
import { experiments } from "@/data/experiments";

export default function ExperimentsPage() {
    const setSelectedExperiment = useSystemStore((s) => s.setSelectedExperiment);
    const setContextContent = useSystemStore((s) => s.setContextContent);

    // Reset selection on mount — ContextPanel shows its own empty state via MODULE_CONFIG
    useEffect(() => {
        setSelectedExperiment(null);
        setContextContent(null);
    }, [setSelectedExperiment, setContextContent]);

    const stats = useMemo(() => [
        { label: "Total", value: experiments.length, icon: FlaskConical },
        { label: "Shipped", value: experiments.filter(e => e.decision === "shipped").length, icon: CheckCircle2, color: "text-(--success)" as const },
        { label: "Iterated", value: experiments.filter(e => e.decision === "iterated").length, icon: RefreshCw, color: "text-(--warning)" as const },
        { label: "Killed", value: experiments.filter(e => e.decision === "killed").length, icon: XCircle, color: "text-(--danger)" as const },
        { label: "Experimental", value: experiments.filter(e => e.decision === "experimental").length, icon: Beaker, color: "text-(--accent)" as const },
    ], []);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">EXPERIMENTS</div>
                <h1 className="text-header mb-1">Experiment Lab</h1>
                <p className="text-sm text-(--text-secondary)">
                    Engineering hypotheses validated through architectural iteration
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 shrink-0">
                {stats.map((stat, idx) => (
                    <ExperimentStatCard key={stat.label} {...stat} delay={idx * 0.08} />
                ))}
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* List Panel (Left) */}
                <div className="col-span-12 lg:col-span-5 overflow-y-auto pr-2 custom-scrollbar">
                     <div className="text-label mb-3">EXPERIMENT LOG</div>
                    <ExperimentList />
                </div>

                {/* Chart Panel (Right) */}
                <div className="col-span-12 lg:col-span-7 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-label">EXPERIMENT DETAIL</div>
                        <div className="text-[10px] font-mono text-(--text-muted) uppercase tracking-wider opacity-60">
                            Hypothesis • Control • Variant
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 surface-1 p-6 rounded-lg border border-(--border-default)">
                        <MetricsChart />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExperimentStatCard({
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
