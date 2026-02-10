"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    explanation?: string;
}

export function MetricCard({
    label,
    value,
    trend = "neutral",
    trendValue,
    explanation,
    icon: Icon,
    delay = 0,
}: MetricCardProps & { icon?: React.ElementType; delay?: number }) {
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const setActiveCard = useSystemStore((s) => s.setActiveCard);

    const handleHover = () => {
        // Clear any active project card so only this metric is in focus
        setActiveCard(null);
        
        if (explanation) {
            setContextContent(`## ${label}\n\n${explanation}`);
        }
    };

    const TrendIcon =
        trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

    const trendColor =
        trend === "up"
            ? "text-[var(--success)]"
            : trend === "down"
                ? "text-[var(--danger)]"
                : "text-[var(--text-muted)]";

    return (
        <motion.div
            className="surface-1 surface-interactive p-4 cursor-pointer relative overflow-hidden group"
            onMouseEnter={handleHover}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="text-label">{label}</div>
                {Icon && <Icon className="w-4 h-4 text-(--text-muted) group-hover:text-(--accent-primary) transition-colors" />}
            </div>

            <div className="flex items-end justify-between">
                <div className="text-header text-metric">{value}</div>
                {trendValue && (
                    <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                        <TrendIcon className="w-3 h-3" />
                        <span className="text-metric">{trendValue}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
