"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import type { Decision } from "@/data/decisions";

// Hover intent delay
const HOVER_INTENT_MS = 250;

interface DecisionCardProps {
    decision: Decision;
}

export function DecisionCard({ decision }: DecisionCardProps) {
    // Granular selectors
    const selectedDecisionId = useSystemStore((s) => s.selectedDecisionId);
    const setSelectedDecision = useSystemStore((s) => s.setSelectedDecision);
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const focusLocked = useSystemStore((s) => s.focusLocked);

    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSelected = selectedDecisionId === decision.id;

    const activateDecision = useCallback(() => {
        setSelectedDecision(decision.id);
        
        // Populate context panel with deep info
        setContextContent(`## ${decision.title}
        
> **Project:** ${decision.project}  
> **Constraint:** ${decision.constraint}

### Why this decision?
${decision.problem}

### The Decision
${decision.decision}

### What was rejected & why
${decision.alternativeRejected}

### Outcome
${decision.outcome}
`);
    }, [decision, setSelectedDecision, setContextContent]);

    const handlePointerEnter = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        if (selectedDecisionId === decision.id) return;
        if (focusLocked) return; // Prevent hover if user is interacting with context panel

        hoverTimerRef.current = setTimeout(activateDecision, HOVER_INTENT_MS);
    }, [selectedDecisionId, decision.id, activateDecision, focusLocked]);

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const handleClick = useCallback(() => {
        if (selectedDecisionId === decision.id) return; // Prevent loop
        activateDecision();
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, [activateDecision, selectedDecisionId, decision.id]);

    // Mouse tracking for glow effect
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mouse-x", `${x}%`);
        card.style.setProperty("--mouse-y", `${y}%`);
    }, []);

    const statusConfig = {
        success: {
            icon: CheckCircle2,
            class: "badge-success",
            label: "SUCCESS",
            border: "group-hover:border-[var(--success)]",
        },
        failed: {
            icon: XCircle,
            class: "badge-danger",
            label: "FAILED",
            border: "group-hover:border-[var(--danger)]",
        },
        iterated: {
            icon: RefreshCw,
            class: "badge-info", // Changed to blue/info as user requested "blue accent" for ITERATED
            label: "ITERATED",
            border: "group-hover:border-[var(--accent-primary)]",
        },
    };

    const status = statusConfig[decision.status];

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "group relative surface-1 p-4 pl-12 cursor-pointer transition-all duration-300 border border-transparent",
                isSelected && "bg-(--bg-surface-2) border-(--border-strong)",
                // Subtle colored border glow on hover based on status
               // status.border
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
             {/* Glow layer */}
             <div className="project-card-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Timeline Dot */}
            <div className={cn(
                "absolute left-3.75 top-6 w-2.25 h-2.25 rounded-full border-2 bg-(--bg-surface-1) z-10 transition-colors duration-300",
                isSelected 
                    ? "border-(--accent-primary) bg-(--accent-primary)" 
                    : "border-(--border-default) group-hover:border-(--text-secondary)"
            )} />

            {/* Content Container */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-(--text-muted)">
                            {decision.number.toString().padStart(3, '0')}
                        </span>
                        <h3 className={cn(
                            "text-sm font-medium transition-colors",
                            isSelected ? "text-foreground" : "text-(--text-secondary) group-hover:text-foreground"
                        )}>
                            {decision.title}
                        </h3>
                    </div>
                     <div className="flex items-center gap-2">
                         <span className={cn("text-[10px] font-bold tracking-wider opacity-80", 
                            decision.status === 'success' ? "text-(--success)" :
                            decision.status === 'failed' ? "text-(--danger)" : 
                            "text-(--accent-primary)" // Blue for iterated/other
                         )}>
                            {status.label}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                     <span className="text-xs text-(--text-muted) font-mono">
                        {decision.project}
                    </span>
                    <span className="text-[10px] text-(--text-disabled) uppercase tracking-wide">
                        {decision.confidence} CONFIDENCE
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
