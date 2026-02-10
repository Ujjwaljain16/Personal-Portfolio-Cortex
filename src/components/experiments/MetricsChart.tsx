"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemStore } from "@/lib/store";
import { experiments } from "@/data/experiments";

export function MetricsChart() {
    const selectedExperimentId = useSystemStore((s) => s.selectedExperimentId);

    const experiment = useMemo(
        () => experiments.find(e => e.id === selectedExperimentId) ?? null,
        [selectedExperimentId]
    );

    if (!experiment) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-(--text-muted) p-8 border border-(--border-default) bg-(--bg-surface-1)/50 rounded-lg border-dashed">
                <p>Select an experiment to view results</p>
            </div>
        );
    }

    const isWin = experiment.decision === "shipped";
    const isLoss = experiment.decision === "killed";
    const isExperimental = experiment.decision === "experimental";

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col space-y-6"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-xs font-mono text-(--text-muted) uppercase tracking-wider mb-1">
                            Experiment
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {experiment.title}
                        </h2>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono text-(--text-muted) uppercase tracking-wider mb-1">
                            Verdict
                        </div>
                        <div className={`text-lg font-bold ${isWin ? "text-(--success)" : isLoss ? "text-(--danger)" : isExperimental ? "text-(--accent)" : "text-(--warning)"}`}>
                            {experiment.decision.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Hypothesis */}
                <div className="bg-(--bg-surface-1) border border-(--border-default) rounded-lg p-4">
                    <div className="text-xs font-mono text-(--text-muted) uppercase tracking-wider mb-2">Hypothesis</div>
                    <p className="text-sm text-(--text-secondary) leading-relaxed">{experiment.hypothesis}</p>
                </div>

                {/* Variants Comparison */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-(--bg-surface-1) border border-(--border-default) rounded-lg p-4 flex flex-col">
                        <div className="text-xs font-mono text-(--text-muted) uppercase tracking-wider mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-(--text-muted) opacity-40" />
                            Control
                        </div>
                        <p className="text-sm text-(--text-secondary) leading-relaxed flex-1">{experiment.variants.control}</p>
                    </div>
                    <div className={`bg-(--bg-surface-1) border ${isLoss ? "border-(--danger)/30" : "border-(--accent-primary)/30"} rounded-lg p-4 flex flex-col`}>
                        <div className={`text-xs font-mono ${isLoss ? "text-(--danger)" : "text-(--accent-primary)"} uppercase tracking-wider mb-2 flex items-center gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${isLoss ? "bg-(--danger)" : "bg-(--accent-primary)"}`} />
                            Variant
                        </div>
                        <p className="text-sm text-(--text-secondary) leading-relaxed flex-1">{experiment.variants.variant}</p>
                    </div>
                </div>

                {/* Killed Experiment Details */}
                {isLoss && experiment.reasonKilled && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-(--bg-surface-1) border border-(--danger)/20 rounded-lg p-4">
                            <div className="text-xs font-mono text-(--danger) uppercase tracking-wider mb-2">Reason Killed</div>
                            <p className="text-sm text-(--text-secondary) leading-relaxed">{experiment.reasonKilled}</p>
                        </div>
                        {experiment.lesson && (
                            <div className="bg-(--bg-surface-1) border border-(--border-default) rounded-lg p-4">
                                <div className="text-xs font-mono text-(--text-muted) uppercase tracking-wider mb-2">Lesson Learned</div>
                                <p className="text-sm text-(--text-secondary) leading-relaxed">{experiment.lesson}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Impact Footer */}
                <div className="border-t border-(--border-default) pt-4">
                     <p className="text-sm text-foreground leading-relaxed">
                        <span className="font-bold mr-2">{isLoss ? "Outcome:" : "Impact:"}</span>
                        {experiment.impact}
                     </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
