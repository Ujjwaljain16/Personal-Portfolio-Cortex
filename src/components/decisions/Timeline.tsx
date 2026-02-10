"use client";

import { useMemo } from "react";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import type { Decision } from "@/data/decisions";

interface TimelineProps {
    decisions: Decision[];
}

export function Timeline({ decisions }: TimelineProps) {
    // Sort by Date Descending (Newest -> Oldest)
    const sortedDecisions = useMemo(() => {
        return [...decisions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [decisions]);

    if (!decisions.length) {
        return (
            <div className="text-sm text-(--text-muted) py-8 pl-8 italic">
                No architectural decisions logged yet.
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100vh-200px)]">
            {/* Timeline line */}
            <div className="absolute left-4.75 top-0 bottom-0 w-px bg-(--border-default)" />

            {/* Decision cards */}
            <div className="space-y-4">
                {sortedDecisions.map((decision) => (
                    <DecisionCard key={decision.id} decision={decision} />
                ))}
            </div>
        </div>
    );
}
