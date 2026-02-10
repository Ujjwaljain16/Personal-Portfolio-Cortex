"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    checkAllEndpoints,
    getOverallStatus,
    type ServiceHealth,
} from "@/lib/health-service";
import { RefreshCw, ExternalLink, Wifi, WifiOff, AlertTriangle } from "lucide-react";

export function HealthMonitor() {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const runChecks = useCallback(async () => {
        setLoading(true);
        const results = await checkAllEndpoints();
        setServices(results);
        setLastChecked(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(runChecks, 0);
        const interval = setInterval(runChecks, 60000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [runChecks]);

    const overall = services.length > 0 ? getOverallStatus(services) : null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="text-label">LIVE HEALTH</div>
                <div className="flex items-center gap-3">
                    {lastChecked && (
                        <span className="text-[10px] font-mono text-(--text-disabled)">
                            {lastChecked.toLocaleTimeString("en-US", { hour12: false })}
                        </span>
                    )}
                    <button
                        onClick={runChecks}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-(--text-muted) hover:text-(--accent-primary) hover:bg-(--bg-surface-2) transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overall status banner */}
            {overall && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border",
                        overall === "operational" && "bg-(--success)/5 border-(--success)/20",
                        overall === "degraded" && "bg-(--warning)/5 border-(--warning)/20",
                        overall === "outage" && "bg-(--danger)/5 border-(--danger)/20"
                    )}
                >
                    {overall === "operational" ? (
                        <Wifi className="w-4 h-4 text-(--success)" />
                    ) : overall === "degraded" ? (
                        <AlertTriangle className="w-4 h-4 text-(--warning)" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-(--danger)" />
                    )}
                    <div>
                        <div className={cn(
                            "text-[12px] font-medium",
                            overall === "operational" ? "text-(--success)" :
                            overall === "degraded" ? "text-(--warning)" : "text-(--danger)"
                        )}>
                            {overall === "operational" ? "All Systems Operational" :
                             overall === "degraded" ? "Partial Degradation Detected" : "Service Outage Detected"}
                        </div>
                        <div className="text-[10px] text-(--text-muted) font-mono mt-0.5">
                            {services.length} endpoints monitored · auto-refresh 60s
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Service cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {loading && services.length === 0
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-lg bg-(--bg-surface-2) animate-pulse" />
                    ))
                    : services.map((svc, i) => (
                        <motion.div
                            key={svc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="surface-1 surface-interactive p-4 space-y-3"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        svc.result.status === "healthy" ? "bg-(--success) animate-pulse" :
                                        svc.result.status === "degraded" ? "bg-(--warning)" : "bg-(--danger)"
                                    )} />
                                    <span className="text-[13px] font-medium text-foreground">
                                        {svc.name}
                                    </span>
                                </div>
                                <a
                                    href={svc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-(--text-muted) hover:text-(--accent-primary) transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-mono uppercase tracking-wider",
                                    svc.result.status === "healthy" ? "text-(--success)" :
                                    svc.result.status === "degraded" ? "text-(--warning)" : "text-(--danger)"
                                )}>
                                    {svc.result.status}
                                </span>
                                <span className="text-[12px] font-mono text-(--text-secondary) tabular-nums">
                                    {svc.result.latencyMs !== null ? `${svc.result.latencyMs}ms` : "—"}
                                </span>
                            </div>

                            {svc.result.error && (
                                <div className="text-[10px] text-(--danger) font-mono truncate">
                                    {svc.result.error}
                                </div>
                            )}
                        </motion.div>
                    ))}
            </div>
        </div>
    );
}
