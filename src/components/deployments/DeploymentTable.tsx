"use client";

import { useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { Radio, Smartphone, Package, Upload, BookOpen, ExternalLink, Eye } from "lucide-react";
import { deployments, CATEGORY_ORDER, CATEGORY_LABELS, type Deployment, type DeploymentStatus } from "@/data/deployments";
import { decisions } from "@/data/decisions";
import { experiments } from "@/data/experiments";

const HOVER_INTENT_MS = 250;

const STATUS_CONFIG: Record<DeploymentStatus, { icon: typeof Radio; label: string; class: string }> = {
    active: { icon: Radio, label: "ACTIVE", class: "text-(--success)" },
    device: { icon: Smartphone, label: "DEVICE", class: "text-(--accent-secondary)" },
    packaged: { icon: Package, label: "PACKAGED", class: "text-(--accent-primary)" },
    published: { icon: Upload, label: "PUBLISHED", class: "text-(--accent-primary)" },
    library: { icon: BookOpen, label: "LIBRARY", class: "text-(--text-secondary)" },
};

const RUNTIME_COLOR: Record<string, string> = {
    "Web App": "text-(--success)",
    "CLI": "text-(--accent-primary)",
    "CLI + Library": "text-(--accent-primary)",
    "Library": "text-(--text-secondary)",
    "Mobile": "text-(--accent-secondary)",
    "Dev Tool": "text-(--accent-primary)",
};

export function DeploymentTable() {
    const grouped = useMemo(() => {
        return CATEGORY_ORDER.reduce<{ category: string; label: string; entries: Deployment[]; startIdx: number }[]>((acc, cat) => {
            const entries = deployments
                .filter(d => d.category === cat)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const startIdx = acc.length > 0 ? acc[acc.length - 1].startIdx + acc[acc.length - 1].entries.length : 0;

            const group = {
                category: cat,
                label: CATEGORY_LABELS[cat],
                entries,
                startIdx
            };
            return [...acc, group];
        }, []);
    }, []);

    return (
        <div className="surface-1 rounded-lg border border-(--border-default) overflow-hidden">

            <div className="sticky top-0 z-10 grid grid-cols-[90px_100px_1fr_90px_90px_80px] gap-3 px-4 py-3 border-b border-(--border-default) bg-(--bg-surface-1) text-label">
                <div>HASH</div>
                <div>REPO</div>
                <div>CHANGE</div>
                <div>SURFACE</div>
                <div>STATUS</div>
                <div className="text-right">SIGNAL</div>
            </div>


            <div className="divide-y divide-(--border-default)">
                {grouped.map(group => {
                    if (group.entries.length === 0) return null;
                    return (
                        <div key={group.category}>
                            <CategoryHeader label={group.label} count={group.entries.length} />
                            {group.entries.map((deployment, idx) => (
                                <DeploymentRow key={deployment.id} deployment={deployment} idx={group.startIdx + idx} />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CategoryHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="px-4 py-2.5 bg-(--bg-surface-2)/50 border-b border-(--border-default)">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-(--text-muted)">
                {label}
            </span>
            <span className="ml-2 text-[9px] font-mono text-(--text-muted)/60">
                ({count})
            </span>
        </div>
    );
}

function DeploymentRow({ deployment, idx }: { deployment: Deployment; idx: number }) {
    const selectedDeploymentId = useSystemStore((s) => s.selectedDeploymentId);
    const setSelectedDeployment = useSystemStore((s) => s.setSelectedDeployment);
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const focusLocked = useSystemStore((s) => s.focusLocked);

    const rowRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSelected = selectedDeploymentId === deployment.id;

    const activateDeployment = useCallback(() => {
        setSelectedDeployment(deployment.id);

        const relatedDecision = deployment.relatedDecisionId
            ? decisions.find(d => d.id === deployment.relatedDecisionId)
            : null;
        const relatedExperiment = deployment.relatedExperimentId
            ? experiments.find(e => e.id === deployment.relatedExperimentId)
            : null;

        const relatedLines = [];
        if (relatedDecision) {
            relatedLines.push(`- **Decision:** ADR-${relatedDecision.number} — ${relatedDecision.title}`);
        }
        if (relatedExperiment) {
            relatedLines.push(`- **Experiment:** ${relatedExperiment.title}`);
        }
        const relatedSection = relatedLines.length > 0
            ? `\n### Related Work\n${relatedLines.join("\n")}`
            : "";

        const surfaceLines = [
            `- **Runtime:** ${deployment.runtime}`,
            `- **Host:** ${deployment.host}`,
        ];
        if (deployment.liveUrl) {
            surfaceLines.push(`- **Live:** [${deployment.liveUrl}](${deployment.liveUrl})`);
        }
        if (deployment.latencyChange) {
            surfaceLines.push(`- **Measured:** ${deployment.latencyChange}`);
        }

        setContextContent({
            type: "markdown",
            content: `## ${deployment.commitMessage}

> **Repository:** ${deployment.repo}
> **Commit:** ${deployment.commit}

### Deployment Surface
${surfaceLines.join("\n")}

### Impact
${deployment.impact}

### Metadata
- **Tags:** ${deployment.tags.join(" · ")}
- **Status:** ${STATUS_CONFIG[deployment.status].label}${deployment.observed ? " · OBSERVED" : ""}
- **Category:** ${CATEGORY_LABELS[deployment.category]}
${relatedSection}`
        });
    }, [deployment, setSelectedDeployment, setContextContent]);

    const handlePointerEnter = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (isSelected || focusLocked) return;
        hoverTimerRef.current = setTimeout(activateDeployment, HOVER_INTENT_MS);
    }, [isSelected, focusLocked, activateDeployment]);

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const handleClick = useCallback(() => {
        if (isSelected) return;
        activateDeployment();
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, [isSelected, activateDeployment]);

    const runtimeColor = RUNTIME_COLOR[deployment.runtime] || "text-(--text-muted)";
    const status = STATUS_CONFIG[deployment.status];
    const StatusIcon = status.icon;

    return (
        <motion.div
            ref={rowRef}
            className={cn(
                "group grid grid-cols-[90px_100px_1fr_90px_90px_80px] gap-3 px-4 py-3 items-center cursor-pointer transition-colors duration-150",
                isSelected
                    ? "bg-(--bg-surface-2)"
                    : "hover:bg-(--bg-surface-1)"
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.03 }}
        >

            <code className="text-xs text-(--accent-primary) font-mono">
                {deployment.commit}
            </code>


            <span className="text-xs text-(--text-secondary) truncate">
                {deployment.repo}
            </span>


            <div className="min-w-0 flex items-center gap-2">
                <span className={cn(
                    "text-xs truncate",
                    isSelected ? "text-foreground" : "text-(--text-secondary) group-hover:text-foreground"
                )}>
                    {deployment.commitMessage}
                </span>
                <div className="hidden md:flex items-center gap-1 shrink-0">
                    {deployment.tags.map(tag => (
                        <span
                            key={tag}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-(--bg-surface-2) text-(--text-muted) border border-(--border-default) uppercase tracking-wider"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>


            {deployment.liveUrl ? (
                <a
                    href={deployment.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-wider text-(--success) hover:text-(--accent-primary) transition-colors"
                >
                    LIVE
                    <ExternalLink className="w-3 h-3" />
                </a>
            ) : (
                <span className={cn("text-[10px] font-mono font-medium uppercase tracking-wider", runtimeColor)}>
                    {deployment.runtime}
                </span>
            )}


            <div className="flex items-center gap-1.5">
                <StatusIcon className={cn("w-3.5 h-3.5", status.class)} />
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", status.class)}>
                    {status.label}
                </span>
            </div>


            <div className="flex justify-end">
                {deployment.observed && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border border-(--accent-primary)/30 bg-(--accent-primary)/10 text-(--accent-primary) uppercase tracking-wider">
                        <Eye className="w-2.5 h-2.5" />
                        OBS
                    </span>
                )}
            </div>
        </motion.div>
    );
}
