"use client";

import { useEffect, useState } from "react";
import { systemMetrics as staticMetrics, projects } from "@/data/projects";
import { metricService } from "../../lib/metric-service";
import {
    Activity,
    Clock,
    GitCommit,
    Cpu
} from "lucide-react";
import { MetricCard } from "@/components/system/MetricCard";

export function SystemMetrics() {
    const [metrics, setMetrics] = useState(staticMetrics);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRealMetrics() {
            const startStr = await metricService.getEngineeringTime();
            const commitData = await metricService.getLastCommit();

            setMetrics(prev => [
                {
                    ...prev[0],
                    value: startStr,
                    label: "Engineering Time"
                },
                {
                    ...prev[1],
                    value: projects.length, // Dynamic active modules count
                },
                {
                    ...prev[2],
                    value: commitData.time,
                    trendValue: commitData.detail,
                    label: "Last Commit"
                },
                prev[3] // Current Focus
            ]);
            setLoading(false);
        }

        fetchRealMetrics();
    }, []);

    const icons = [Clock, Activity, GitCommit, Cpu];

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-(--bg-surface-2) animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = icons[idx];
                return (
                    <MetricCard
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        trend={metric.trend}
                        trendValue={metric.trendValue}
                        explanation={metric.explanation}
                        icon={Icon}
                        delay={idx * 0.1}
                    />
                );
            })}
        </div>
    );
}
