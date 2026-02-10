"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { TrendingUp } from "lucide-react";
import { experiments, type Experiment } from "@/data/experiments";
import { decisions } from "@/data/decisions";
import { deployments } from "@/data/deployments";

// Hover intent delay
const HOVER_INTENT_MS = 250;

export function ExperimentList() {
    return (
        <div className="space-y-2">
            {experiments.map((experiment) => (
                <ExperimentRow key={experiment.id} experiment={experiment} />
            ))}
        </div>
    );
}

function ExperimentRow({ experiment }: { experiment: Experiment }) {
    const selectedExperimentId = useSystemStore((s) => s.selectedExperimentId);
    const setSelectedExperiment = useSystemStore((s) => s.setSelectedExperiment);
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const focusLocked = useSystemStore((s) => s.focusLocked);

    const rowRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSelected = selectedExperimentId === experiment.id;

    const decisionColor = 
         experiment.decision === "shipped" ? "text-(--success)" :
         experiment.decision === "killed" ? "text-(--danger)" :
         experiment.decision === "experimental" ? "text-(--accent)" :
         "text-(--warning)";

    const activateExperiment = useCallback(() => {
        setSelectedExperiment(experiment.id);

        // Resolve linked decision
        const linkedDecision = experiment.linkedDecisionId
            ? decisions.find(d => d.id === experiment.linkedDecisionId)
            : null;

        // Resolve linked deployment (any deployment referencing this experiment)
        const linkedDeployment = deployments.find(
            d => d.relatedExperimentId === experiment.id
        );

        const verdictLabel = experiment.decision.toUpperCase();

        const signalLines = experiment.signals
            .map(s => `- ${s}`)
            .join("\n");

        const linkedLines: string[] = [];
        if (linkedDecision) {
            linkedLines.push(`> **Linked Decision:** ADR-${linkedDecision.number} — ${linkedDecision.title}`);
        }
        if (linkedDeployment) {
            linkedLines.push(`> **Linked Deployment:** ${linkedDeployment.id} — ${linkedDeployment.commitMessage}`);
        }

        setContextContent({
            type: "markdown",
            content: `## EXPERIMENT SIGNALS

> **Project:** ${experiment.project}
> **Category:** ${experiment.category}
> **Experiment:** ${experiment.id}
> **Verdict:** ${verdictLabel}
> **Risk Level:** ${experiment.riskLevel}
> **Surface Area:** ${experiment.surfaceArea}

${linkedLines.length > 0 ? `### Linked Work\n${linkedLines.join("\n")}\n` : ""}### Architecture Signals
${signalLines}`
        });
    }, [experiment, setSelectedExperiment, setContextContent]);

    const handlePointerEnter = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (isSelected) return;
        if (focusLocked) return;

        hoverTimerRef.current = setTimeout(activateExperiment, HOVER_INTENT_MS);
    }, [isSelected, activateExperiment, focusLocked]);

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const handleClick = useCallback(() => {
        if (isSelected) return;
        activateExperiment();
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, [activateExperiment, isSelected]);

    return (
        <motion.div
            ref={rowRef}
            className={cn(
                "group relative p-3 rounded-lg border border-transparent cursor-pointer transition-all duration-200",
                isSelected 
                    ? "bg-(--bg-surface-2) border-(--border-strong)" 
                    : "hover:bg-(--bg-surface-1) hover:border-(--border-default)"
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
             {/* Glow layer (reuse from decisions/system) */}
             <div className="project-card-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-(--text-muted) uppercase tracking-wider">
                            [{experiment.id}]
                        </span>
                        <h3 className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-foreground" : "text-foreground opacity-80"
                        )}>
                            {experiment.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-(--text-secondary)">
                        <TrendingUp className="w-3 h-3 text-(--text-muted)" />
                        <span className="truncate">{experiment.project}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                    <div className={cn("text-[10px] font-bold uppercase tracking-wide flex items-center gap-1", decisionColor)}>
                         {experiment.decision}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
