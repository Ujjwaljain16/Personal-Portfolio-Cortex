"use client";

import { DeploymentTable } from "@/components/deployments/DeploymentTable";
import { deployments } from "@/data/deployments";
import { useEffect, useMemo } from "react";
import { useSystemStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Globe, Smartphone, Terminal, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeploymentsPage() {
    const setSelectedDeployment = useSystemStore((s) => s.setSelectedDeployment);
    const setContextContent = useSystemStore((s) => s.setContextContent);

    useEffect(() => {
        setSelectedDeployment(null);
        setContextContent(null);
    }, [setSelectedDeployment, setContextContent]);

    const stats = useMemo(() => [
        { label: "Live Web", value: deployments.filter(d => d.category === "live").length, icon: Globe, color: "text-(--success)" as const },
        { label: "Device", value: deployments.filter(d => d.category === "device").length, icon: Smartphone, color: "text-(--accent-secondary)" as const },
        { label: "Runtime", value: deployments.filter(d => d.category === "runtime").length, icon: Terminal, color: "text-(--accent-primary)" as const },
        { label: "Observed", value: deployments.filter(d => d.observed).length, icon: Eye },
    ], []);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">DEPLOYMENTS</div>
                <h1 className="text-header mb-1">Deployments</h1>
                <p className="text-sm text-(--text-secondary)">
                    Deployment surfaces and runtime execution history
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                {stats.map((stat, idx) => (
                    <DeploymentStatCard key={stat.label} {...stat} delay={idx * 0.08} />
                ))}
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <DeploymentTable />
            </div>
        </div>
    );
}

function DeploymentStatCard({
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
