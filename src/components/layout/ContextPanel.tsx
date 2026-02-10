"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemStore } from "@/lib/store";
import { type LucideIcon, Hash, Code, Rocket, FlaskConical, LayoutDashboard, BookOpen, MessageSquare, Power, Settings, Activity, GitBranch } from "lucide-react";

import { ContextContent } from "@/lib/store";

const MODULE_CONFIG: Record<string, {
    header: string;
    icon: LucideIcon;
    emptyTitle: string;
    emptyDesc: string;
    subtext: string;
}> = {
    "/": {
        header: "SYSTEM ENTRY",
        icon: Power,
        emptyTitle: "Engineering Control Plane",
        emptyDesc: "Navigate modules to inspect architecture signals",
        subtext: "Identity • Systems • Principles"
    },
    "/system": {
        header: "SYSTEM ANALYSIS",
        icon: Activity,
        emptyTitle: "System Neural Link",
        emptyDesc: "Select a component to reveal context",
        subtext: "Architecture • Decisions • Metrics"
    },
    "/decisions": {
        header: "DECISION LOG",
        icon: GitBranch,
        emptyTitle: "Engineering Decision Log",
        emptyDesc: "Select a decision to inspect tradeoffs",
        subtext: "Problem • Constraint • Outcome"
    },
    "/experiments": {
        header: "EXPERIMENT LAB",
        icon: FlaskConical,
        emptyTitle: "Experiment Registry",
        emptyDesc: "Select an experiment to inspect metrics",
        subtext: "Hypothesis • Metrics • Results"
    },
    "/deployments": {
        header: "DEPLOYMENT HISTORY",
        icon: Rocket,
        emptyTitle: "Deployment Log",
        emptyDesc: "Select a release to inspect impact",
        subtext: "CI/CD • Rollbacks • Status"
    },
    "/blogs": {
        header: "ENGINEERING BLOG",
        icon: BookOpen,
        emptyTitle: "Knowledge Base",
        emptyDesc: "Select a post to read engineering insights",
        subtext: "Architecture • Decisions • Learnings"
    },
    "/ask": {
        header: "CTO SIMULATION",
        icon: MessageSquare,
        emptyTitle: "Ask How I Think",
        emptyDesc: "Query engineering decisions grounded in real data",
        subtext: "Decisions • Tradeoffs • Outcomes"
    },
    "/settings": {
        header: "CONFIGURATION",
        icon: Settings,
        emptyTitle: "System Settings",
        emptyDesc: "Configure preferences and view system information",
        subtext: "Theme • Preferences • Info"
    },
    "default": {
        header: "SYSTEM ANALYSIS",
        icon: LayoutDashboard,
        emptyTitle: "System Neural Link",
        emptyDesc: "Select a component to reveal context",
        subtext: "Architecture • Decisions • Metrics"
    }
};

function parseArchitectureSummary(summary: string) {
    const parts = summary
        .split(". ")
        .map((p) => p.trim())
        .filter(Boolean);

    return {
        identity: (parts[0] || "") + (parts[0]?.endsWith(".") ? "" : "."),
        architecture: (parts[1] || "") + (parts[1]?.endsWith(".") ? "" : "."),
        controls: (parts[2] || "") + (parts[2]?.endsWith(".") ? "" : "."),
        intent: (parts[3] || "") + (parts[3]?.endsWith(".") ? "" : "."),
    };
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    if (!children || children === ".") return null;
    return (
        <div className="space-y-2 mb-6 last:mb-0">
            <div className="text-[10px] tracking-widest text-(--accent-primary) uppercase opacity-90 font-mono">
                {label}
            </div>
            <div className="text-sm leading-relaxed text-(--text-secondary)">
                {children}
            </div>
        </div>
    );
}

function ArchitectureContextPanel({
    content,
}: {
    content: Extract<ContextContent, { type: "architecture" }>;
}) {
    const sections = parseArchitectureSummary(content.architectureSummary);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header className="pb-4 border-b border-(--border-default)">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    {content.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--success) animate-pulse"></span>
                    <p className="text-[10px] text-(--text-muted) font-mono uppercase tracking-wider">
                        System Architecture
                    </p>
                </div>
            </header>

            <div className="pt-2">
                {content.description && (
                    <Section label="System Overview">
                        {content.description}
                    </Section>
                )}

                <Section label="System Identity">{sections.identity}</Section>
                <Section label="Core Architecture">{sections.architecture}</Section>
                <Section label="Control & Safety">{sections.controls}</Section>
                <Section label="Operational Intent">{sections.intent}</Section>

                {content.tech && content.tech.length > 0 && (
                    <div className="space-y-3 mt-8 pt-6 border-t border-(--border-default)">
                        <div className="text-[10px] tracking-widest text-(--text-muted) uppercase opacity-70 font-mono">
                            Technology Stack
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {content.tech.map((t) => (
                                <span
                                    key={t}
                                    className="text-[10px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default)"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TypedContent({ content }: { content: string }) {
    const lines = content.split("\n");
    return (
        <div className="space-y-3">
            {lines.map((line, idx) => {
                if (line.startsWith("## ")) {
                    return (
                        <h2
                            key={idx}
                            className="text-base font-medium text-foreground flex items-center gap-2 mt-4 first:mt-0"
                        >
                            <Hash className="w-3.5 h-3.5 text-(--accent-primary)" />
                            {line.slice(3)}
                        </h2>
                    );
                }
                if (line.startsWith("### ")) {
                    return (
                        <h3
                            key={idx}
                            className="text-sm font-medium text-foreground flex items-center gap-2 mt-3"
                        >
                            <Code className="w-3 h-3 text-(--accent-secondary)" />
                            {line.slice(4)}
                        </h3>
                    );
                }
                if (line.startsWith("> ")) {
                    const inner = line.slice(2);
                    return (
                        <div key={idx} className="pl-3 border-l-2 border-(--accent-primary) my-2">
                            <p className="text-sm text-(--text-secondary) italic">
                                {inner.includes("**")
                                    ? inner.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                                        i % 2 === 1 ? (
                                            <strong key={i} className="text-foreground font-medium">
                                                {part}
                                            </strong>
                                        ) : (
                                            part
                                        )
                                    )
                                    : inner}
                            </p>
                        </div>
                    );
                }
                if (line.trim() === "---") {
                    return (
                        <hr
                            key={idx}
                            className="border-t border-(--border-default) my-3"
                        />
                    );
                }
                if (line.includes("**")) {
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                        <p key={idx} className="text-sm text-(--text-secondary) leading-relaxed">
                            {parts.map((part, i) =>
                                i % 2 === 1 ? (
                                    <strong key={i} className="text-foreground font-medium">
                                        {part}
                                    </strong>
                                ) : (
                                    part
                                )
                            )}
                        </p>
                    );
                }
                if (!line.trim()) return <div key={idx} className="h-1" />;
                return (
                    <p key={idx} className="text-sm text-(--text-secondary) leading-relaxed">
                        {line}
                    </p>
                );
            })}
        </div>
    );
}

export function ContextPanel() {
    const { contextPanelContent, simulateMode, setFocusLocked, setContextContent } = useSystemStore();
    const contentRef = useRef<HTMLDivElement>(null);
    const prevContentRef = useRef<ContextContent | null>(null);

    const pathname = usePathname();
    const activeConfig = MODULE_CONFIG[pathname] || MODULE_CONFIG.default;

    useEffect(() => {
        setContextContent(null);
    }, [pathname, setContextContent]);

    useEffect(() => {
        prevContentRef.current = contextPanelContent;
    }, [contextPanelContent]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [contextPanelContent]);

    const HeaderIcon = activeConfig.icon;
    const headerTitle = activeConfig.header;

    return (
        <aside
            className="context-panel flex flex-col h-full bg-(--bg-surface-1) border-l border-(--border-default)"
            onMouseEnter={() => setFocusLocked(true)}
            onMouseLeave={() => setFocusLocked(false)}
        >
            <div className="p-4 border-b border-(--border-default) shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HeaderIcon className="w-4 h-4 text-(--accent-primary)" />
                        <span className="text-label">
                            {headerTitle}
                        </span>
                    </div>
                    {simulateMode && (
                        <span className="badge badge-info text-[9px]">FOUNDER MODE</span>
                    )}
                </div>
            </div>

            <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
                <AnimatePresence>
                    {contextPanelContent ? (
                        <motion.div
                            key={
                                contextPanelContent.type === "architecture"
                                    ? contextPanelContent.title
                                    : contextPanelContent.content.slice(0, 50)
                            }
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.05 }}
                        >
                            {contextPanelContent.type === "architecture" ? (
                                <ArchitectureContextPanel content={contextPanelContent} />
                            ) : (
                                <TypedContent content={contextPanelContent.content} />
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="w-14 h-14 rounded-xl bg-(--bg-surface-2) flex items-center justify-center mb-4 border border-(--border-default)">
                                    <activeConfig.icon className="w-6 h-6 text-(--text-muted) opacity-50" />
                                </div>
                                <p className="text-sm text-foreground max-w-50 mb-2 font-medium">
                                    {activeConfig.emptyTitle}
                                </p>
                                <p className="text-xs text-(--text-secondary) mb-1">
                                    {activeConfig.emptyDesc}
                                </p>
                                <p className="text-[10px] text-(--text-muted) opacity-60 uppercase tracking-wider font-mono mt-2">
                                    {activeConfig.subtext}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-(--border-default) shrink-0">
                <div className="flex items-center justify-between text-[10px] text-(--text-muted) font-mono">
                    <span> Cortex // system-observability</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-(--success) animate-pulse" />
                        <span>ACTIVE</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
