"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { checkAllEndpoints, getOverallStatus, type ServiceHealth } from "@/lib/health-service";
import { RefreshCw } from "lucide-react";

export function StatusBar() {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const runChecks = useCallback(async () => {
        setLoading(true);
        try {
            const results = await checkAllEndpoints();
            setServices(results);
            setLastChecked(new Date());
        } catch {
            // fail silently
        }
        setLoading(false);
    }, []);

    // Initial check + poll every 60s
    useEffect(() => {
        const timeout = setTimeout(runChecks, 0);
        const interval = setInterval(runChecks, 60000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [runChecks]);

    const overall = services.length > 0 ? getOverallStatus(services) : "operational";

    const overallColor = {
        operational: "bg-(--success)",
        degraded: "bg-(--warning)",
        outage: "bg-(--danger)",
    }[overall];

    const overallLabel = {
        operational: "ALL SYSTEMS OPERATIONAL",
        degraded: "PARTIAL DEGRADATION",
        outage: "SERVICE OUTAGE",
    }[overall];

    return (
        <div className="p-3 space-y-2.5">
            {/* Overall status */}
            <div className="flex items-center justify-between">
                <div className="text-[9px] font-mono uppercase tracking-wider text-(--text-muted) opacity-60">
                    LIVE STATUS
                </div>
                <button
                    onClick={runChecks}
                    disabled={loading}
                    className="p-1 rounded hover:bg-(--bg-surface-2) text-(--text-muted) hover:text-(--accent-primary) transition-colors disabled:opacity-50 cursor-pointer"
                    title="Refresh health checks"
                >
                    <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", overallColor, !loading && "animate-pulse")} />
                <span className={cn(
                    "text-[10px] font-mono tracking-wider",
                    overall === "operational" ? "text-(--success)" :
                    overall === "degraded" ? "text-(--warning)" : "text-(--danger)"
                )}>
                    {loading && services.length === 0 ? "CHECKING..." : overallLabel}
                </span>
            </div>

            {/* Per-service status */}
            {services.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    {services.map(svc => (
                        <div key={svc.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    svc.result.status === "healthy" ? "bg-(--success)" :
                                    svc.result.status === "degraded" ? "bg-(--warning)" : "bg-(--danger)"
                                )} />
                                <span className="text-[10px] text-(--text-secondary) truncate">
                                    {svc.name}
                                </span>
                            </div>
                            <span className={cn(
                                "text-[10px] font-mono tabular-nums shrink-0",
                                svc.result.status === "healthy" ? "text-(--success)" :
                                svc.result.status === "degraded" ? "text-(--warning)" : "text-(--danger)"
                            )}>
                                {svc.result.latencyMs !== null ? `${svc.result.latencyMs}ms` : "—"}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Last checked */}
            {lastChecked && (
                <div className="text-[9px] font-mono text-(--text-disabled) pt-0.5">
                    checked {lastChecked.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}
                </div>
            )}
        </div>
    );
}
