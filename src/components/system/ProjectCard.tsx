"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { ExternalLink } from "lucide-react";

// Hover intent delay — prevents accidental triggers when
// the mouse crosses cards on the way to the context panel
const HOVER_INTENT_MS = 250;

interface ProjectCardProps {
    id: string;
    name: string;
    status: "active" | "stable" | "archived" | "in-dev";
    description: string;
    tech: string[];
    architectureSummary: string;
    link?: string;
}

export function ProjectCard({
    id,
    name,
    status,
    description,
    tech,
    architectureSummary,
    link,
}: ProjectCardProps) {
    // Granular selectors — only re-render when THIS card's active state changes
    const activeCardId = useSystemStore((s) => s.activeCardId);
    const setActiveCard = useSystemStore((s) => s.setActiveCard);
    const setContextContent = useSystemStore((s) => s.setContextContent);

    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isActive = activeCardId === id;

    const activateCard = useCallback(() => {
        setActiveCard(id);
        setContextContent({
            type: "architecture",
            title: name,
            architectureSummary,
            description,
            tech,
        });
    }, [id, name, architectureSummary, description, tech, setActiveCard, setContextContent]);

    const handlePointerEnter = useCallback(() => {
        // Clear any pending timer from a previous card
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        // If already active, no delay needed (user returned to same card)
        if (activeCardId === id) return;

        // Debounced hover intent — only fires if mouse stays 250ms
        hoverTimerRef.current = setTimeout(activateCard, HOVER_INTENT_MS);
    }, [activeCardId, id, activateCard]);

    const handlePointerLeave = useCallback(() => {
        // Mouse left before the intent threshold — cancel activation
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    // Track mouse position for radial glow
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mouse-x", `${x}%`);
        card.style.setProperty("--mouse-y", `${y}%`);
    }, []);

    const statusColors = {
        active: "badge-success",
        stable: "badge-info",
        archived: "badge-warning",
        "in-dev": "badge-warning",
    };

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "project-card surface-1 p-4 cursor-pointer relative overflow-hidden",
                isActive && "project-card--active"
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onMouseMove={handleMouseMove}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Glow layer — follows cursor, persists when active */}
            <div className="project-card-glow" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">
                        {name}
                    </h3>
                    <span className={cn("badge", statusColors[status])}>
                        {status}
                    </span>
                </div>

                <p className="text-xs text-(--text-secondary) mb-3 line-clamp-2">
                    {description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {tech.slice(0, 3).map((t) => (
                            <span
                                key={t}
                                className="tech-tag text-[10px] px-1.5 py-0.5 rounded bg-(--bg-surface-2) text-(--text-muted)"
                            >
                                {t}
                            </span>
                        ))}
                        {tech.length > 3 && (
                            <span className="text-[9px] text-(--text-muted) font-mono opacity-60 self-center ml-0.5">
                                +{tech.length - 3}
                            </span>
                        )}
                    </div>

                    {link && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-(--text-muted) hover:text-(--accent-primary) transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
