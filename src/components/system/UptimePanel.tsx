"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    checkAllEndpoints,
    getOverallStatus,
    type ServiceHealth,
} from "@/lib/health-service";
import { Wifi, WifiOff, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";

export function UptimePanel() {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);

    const runChecks = useCallback(async () => {
        setLoading(true);
        const results = await checkAllEndpoints();
        setServices(results);
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
        <section>
            <div className="flex items-center justify-between mb-3">
                <div className="text-label">LIVE ENDPOINTS</div>
                <button
                    onClick={runChecks}
                    disabled={loading}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-(--text-muted) hover:text-(--accent-primary) transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                </button>
            </div>

            {/* Overall status */}
            {overall && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg mb-4 border",
                        overall === "operational" && "bg-(--success)/5 border-(--success)/20",
                        overall === "degraded" && "bg-(--warning)/5 border-(--warning)/20",
                        overall === "outage" && "bg-(--danger)/5 border-(--danger)/20"
                    )}
                >
                    {overall === "operational" ? (
                        <Wifi className="w-3.5 h-3.5 text-(--success)" />
                    ) : overall === "degraded" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-(--warning)" />
                    ) : (
                        <WifiOff className="w-3.5 h-3.5 text-(--danger)" />
                    )}
                    <span className={cn(
                        "text-[11px] font-mono uppercase tracking-wider",
                        overall === "operational" ? "text-(--success)" :
                        overall === "degraded" ? "text-(--warning)" : "text-(--danger)"
                    )}>
                        {overall === "operational" ? "All Operational" :
                         overall === "degraded" ? "Degraded" : "Outage"}
                    </span>
                    <span className="text-[10px] text-(--text-muted) font-mono ml-auto">
                        {services.filter(s => s.result.status === "healthy").length}/{services.length} up
                    </span>
                </motion.div>
            )}

            {/* Service rows */}
            <div className="space-y-2">
                {loading && services.length === 0
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-(--bg-surface-2) animate-pulse" />
                    ))
                    : services.map((svc, i) => (
                        <motion.div
                            key={svc.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center justify-between px-4 py-3 surface-1 surface-interactive rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    svc.result.status === "healthy" ? "bg-(--success) animate-pulse" :
                                    svc.result.status === "degraded" ? "bg-(--warning)" : "bg-(--danger)"
                                )} />
                                <div>
                                    <div className="text-[13px] font-medium text-foreground">{svc.name}</div>
                                    <div className="text-[10px] text-(--text-muted) font-mono truncate max-w-50">{svc.url}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className={cn(
                                        "text-[11px] font-mono tabular-nums",
                                        svc.result.status === "healthy" ? "text-(--success)" :
                                        svc.result.status === "degraded" ? "text-(--warning)" : "text-(--danger)"
                                    )}>
                                        {svc.result.latencyMs !== null ? `${svc.result.latencyMs}ms` : "timeout"}
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-mono uppercase tracking-wider",
                                        svc.result.status === "healthy" ? "text-(--success)" :
                                        svc.result.status === "degraded" ? "text-(--warning)" : "text-(--danger)"
                                    )}>
                                        {svc.result.status}
                                    </div>
                                </div>
                                <a
                                    href={svc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-(--text-muted) hover:text-(--accent-primary) transition-colors shrink-0"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
}
