"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Search,
    Activity,
    GitBranch,
    FlaskConical,
    Rocket,
    BookOpen,
    MessageSquare,
    Power,
    FileDown,
    ArrowRight,
    Command,
} from "lucide-react";
import { decisions } from "@/data/decisions";
import { experiments } from "@/data/experiments";
import { projects } from "@/data/projects";

// ─── Command types ──────────────────────────────

interface CommandItem {
    id: string;
    label: string;
    sublabel?: string;
    icon: React.ElementType;
    category: string;
    action: () => void;
    keywords?: string[];
}

// ─── Component ──────────────────────────────────

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Build command list
    const commands = useMemo<CommandItem[]>(() => {
        const nav: CommandItem[] = [
            { id: "nav-home", label: "Home", icon: Power, category: "Navigate", action: () => router.push("/"), keywords: ["landing", "boot", "about"] },
            { id: "nav-system", label: "System Overview", icon: Activity, category: "Navigate", action: () => router.push("/system"), keywords: ["dashboard", "metrics", "status"] },
            { id: "nav-decisions", label: "Decisions", icon: GitBranch, category: "Navigate", action: () => router.push("/decisions"), keywords: ["adr", "architecture", "tradeoff"] },
            { id: "nav-experiments", label: "Experiments", icon: FlaskConical, category: "Navigate", action: () => router.push("/experiments"), keywords: ["hypothesis", "test", "variant"] },
            { id: "nav-deployments", label: "Deployments", icon: Rocket, category: "Navigate", action: () => router.push("/deployments"), keywords: ["deploy", "release", "live"] },
            { id: "nav-blogs", label: "Blogs", icon: BookOpen, category: "Navigate", action: () => router.push("/blogs"), keywords: ["writing", "articles", "engineering", "thoughts", "mcp", "architecture"] },
            { id: "nav-ask", label: "Ask", icon: MessageSquare, category: "Navigate", action: () => router.push("/ask"), keywords: ["chat", "ai", "query", "cto"] },
        ];

        const projectCmds: CommandItem[] = projects.map(p => ({
            id: `proj-${p.id}`,
            label: p.name,
            sublabel: p.status,
            icon: Activity,
            category: "Projects",
            action: () => router.push("/system"),
            keywords: [...p.tech.map(t => t.toLowerCase()), p.status],
        }));

        const decisionCmds: CommandItem[] = decisions.slice(0, 15).map(d => ({
            id: `dec-${d.id}`,
            label: `ADR-${d.number}: ${d.title}`,
            sublabel: d.project,
            icon: GitBranch,
            category: "Decisions",
            action: () => router.push("/decisions"),
            keywords: [d.project.toLowerCase(), d.status],
        }));

        const experimentCmds: CommandItem[] = experiments.slice(0, 10).map(e => ({
            id: `exp-${e.id}`,
            label: e.title,
            sublabel: e.project,
            icon: FlaskConical,
            category: "Experiments",
            action: () => router.push("/experiments"),
            keywords: [e.project.toLowerCase(), e.decision],
        }));

        const actions: CommandItem[] = [
            { id: "act-resume", label: "Download Resume", icon: FileDown, category: "Actions", action: () => window.open("/resume.pdf", "_blank"), keywords: ["cv", "pdf"] },
            { id: "act-github", label: "Open GitHub", icon: ArrowRight, category: "Actions", action: () => window.open("https://github.com/Ujjwaljain16", "_blank"), keywords: ["code", "repo"] },
        ];

        return [...nav, ...projectCmds, ...decisionCmds, ...experimentCmds, ...actions];
    }, [router]);

    // Filter commands
    const filtered = useMemo(() => {
        if (!query.trim()) return commands.slice(0, 20);
        const q = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.sublabel?.toLowerCase().includes(q) ||
            cmd.category.toLowerCase().includes(q) ||
            cmd.keywords?.some(k => k.includes(q))
        ).slice(0, 15);
    }, [query, commands]);

    // Group by category
    const grouped = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {};
        for (const cmd of filtered) {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        }
        return groups;
    }, [filtered]);

    // Keyboard shortcut to open
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Execute command
    const executeCommand = useCallback((cmd: CommandItem) => {
        setOpen(false);
        cmd.action();
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                executeCommand(filtered[selectedIndex]);
            }
        }
    }, [filtered, selectedIndex, executeCommand]);

    // Scroll selected item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const activeEl = list.querySelector("[data-active='true']");
        activeEl?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    if (!open) return null;

    let flatIndex = 0;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />

                    {/* Palette */}
                    <motion.div
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-140 z-101"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="bg-(--bg-surface-1) border border-(--border-default) rounded-xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 border-b border-(--border-default)">
                                <Search className="w-4 h-4 text-(--text-muted) shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search modules, decisions, projects..."
                                    className="flex-1 py-3.5 bg-transparent text-sm text-foreground placeholder:text-(--text-disabled) focus:outline-none font-mono"
                                />
                                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-(--bg-surface-2) text-(--text-muted) border border-(--border-default)">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div ref={listRef} className="max-h-90 overflow-y-auto py-2">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <div className="text-sm text-(--text-muted)">No results found</div>
                                        <div className="text-[11px] text-(--text-disabled) mt-1 font-mono">
                                            Try searching for a module, project, or decision
                                        </div>
                                    </div>
                                ) : (
                                    Object.entries(grouped).map(([category, items]) => (
                                        <div key={category}>
                                            <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-(--text-muted) opacity-60">
                                                {category}
                                            </div>
                                            {items.map((cmd) => {
                                                const idx = flatIndex++;
                                                const isActive = idx === selectedIndex;
                                                const Icon = cmd.icon;
                                                return (
                                                    <button
                                                        key={cmd.id}
                                                        data-active={isActive}
                                                        onClick={() => executeCommand(cmd)}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                                            isActive
                                                                ? "bg-(--accent-primary)/10 text-foreground"
                                                                : "text-(--text-secondary) hover:bg-(--bg-surface-2)"
                                                        )}
                                                    >
                                                        <Icon className={cn(
                                                            "w-4 h-4 shrink-0",
                                                            isActive ? "text-(--accent-primary)" : "text-(--text-muted)"
                                                        )} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[13px] truncate">{cmd.label}</div>
                                                            {cmd.sublabel && (
                                                                <div className="text-[10px] text-(--text-muted) font-mono truncate">
                                                                    {cmd.sublabel}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isActive && (
                                                            <ArrowRight className="w-3 h-3 text-(--accent-primary) shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2 border-t border-(--border-default) flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] text-(--text-disabled) font-mono">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.5 rounded bg-(--bg-surface-2) border border-(--border-default)">↑↓</kbd>
                                        navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-0.5 rounded bg-(--bg-surface-2) border border-(--border-default)">↵</kbd>
                                        select
                                    </span>
                                </div>
                                <div className="text-[10px] text-(--text-disabled) font-mono flex items-center gap-1">
                                    <Command className="w-3 h-3" />K to toggle
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Trigger button for sidebar/mobile
export function CommandPaletteTrigger() {
    const triggerOpen = useCallback(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    }, []);

    return (
        <button
            onClick={triggerOpen}
            className="flex items-center gap-2 w-full px-3 py-2 mx-2 rounded-lg text-[12px] text-(--text-muted) bg-(--bg-surface-2) border border-(--border-default) hover:border-(--border-hover) transition-colors cursor-pointer"
        >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left font-mono">Search...</span>
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-(--bg-surface-3) text-(--text-disabled) border border-(--border-default)">
                ⌘K
            </kbd>
        </button>
    );
}
