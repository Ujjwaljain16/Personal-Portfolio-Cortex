"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useId } from "react";
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
    Layers,
    FileDown,
    ArrowRight,
    Command,
} from "lucide-react";
import type { SearchEntry } from "@/lib/searchIndex";

export const PALETTE_EVENT = "cortex:palette";

interface CommandItem {
    id: string;
    label: string;
    sublabel?: string;
    icon: React.ElementType;
    category: string;
    action: () => void;
    keywords?: string[];
}

/**
 * Site search / command palette (Ctrl or Cmd + K, or the visible Search
 * button). Semantics: a modal dialog containing a combobox input that controls
 * a listbox; the active option is exposed through aria-activedescendant, focus
 * stays in the input, Escape closes, and focus returns to whatever opened it.
 */
const CATEGORY_ICON: Record<SearchEntry["category"], React.ElementType> = {
    Projects: Layers,
    Writing: BookOpen,
    Decisions: GitBranch,
    Investigations: FlaskConical,
};

export function CommandPalette({ entries }: { entries: SearchEntry[] }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const router = useRouter();
    const listId = useId();
    const openRef = useRef(false);

    const close = useCallback(() => {
        setOpen(false);
        // Return focus to the control that opened the palette.
        const opener = openerRef.current;
        openerRef.current = null;
        setTimeout(() => opener?.focus(), 0);
    }, []);

    const show = useCallback(() => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setQuery("");
        setSelectedIndex(0);
        setOpen(true);
    }, []);

    const commands = useMemo<CommandItem[]>(() => {
        const go = (href: string) => () => router.push(href);

        const nav: CommandItem[] = [
            { id: "nav-home", label: "Home", icon: Power, category: "Navigate", action: go("/"), keywords: ["landing", "about"] },
            { id: "nav-projects", label: "Projects", icon: Layers, category: "Navigate", action: go("/projects"), keywords: ["work", "portfolio", "featured"] },
            { id: "nav-system", label: "System overview", icon: Activity, category: "Navigate", action: go("/system"), keywords: ["github", "activity", "status"] },
            { id: "nav-decisions", label: "Decisions", icon: GitBranch, category: "Navigate", action: go("/decisions"), keywords: ["adr", "architecture", "tradeoff"] },
            { id: "nav-investigations", label: "Investigations", icon: FlaskConical, category: "Navigate", action: go("/investigations"), keywords: ["experiments", "benchmark", "root cause"] },
            { id: "nav-deployments", label: "Deployments", icon: Rocket, category: "Navigate", action: go("/deployments"), keywords: ["deploy", "release", "live"] },
            { id: "nav-blogs", label: "Writing", icon: BookOpen, category: "Navigate", action: go("/blogs"), keywords: ["blog", "articles", "posts"] },
            { id: "nav-ask", label: "Ask", icon: MessageSquare, category: "Navigate", action: go("/ask"), keywords: ["chat", "ai", "question"] },
        ];

        const contentCmds: CommandItem[] = entries.map((e) => ({
            id: e.id,
            label: e.label,
            sublabel: e.sublabel,
            icon: CATEGORY_ICON[e.category],
            category: e.category,
            action: go(e.href),
            keywords: e.keywords,
        }));

        const actions: CommandItem[] = [
            { id: "act-resume", label: "Open resume (PDF)", icon: FileDown, category: "Actions", action: () => window.open("/resume.pdf", "_blank", "noopener"), keywords: ["cv", "pdf"] },
            { id: "act-github", label: "Open GitHub profile", icon: ArrowRight, category: "Actions", action: () => window.open("https://github.com/Ujjwaljain16", "_blank", "noopener"), keywords: ["code", "repo"] },
        ];

        return [...nav, ...contentCmds, ...actions];
    }, [router, entries]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands.filter((c) => c.category === "Navigate" || c.category === "Projects" || c.category === "Actions");
        return commands
            .filter(
                (cmd) =>
                    cmd.label.toLowerCase().includes(q) ||
                    cmd.sublabel?.toLowerCase().includes(q) ||
                    cmd.category.toLowerCase().includes(q) ||
                    cmd.keywords?.some((k) => k.includes(q))
            )
            .slice(0, 20);
    }, [query, commands]);

    const grouped = useMemo(() => {
        const groups: { category: string; items: { cmd: CommandItem; index: number }[] }[] = [];
        filtered.forEach((cmd, index) => {
            let g = groups.find((x) => x.category === cmd.category);
            if (!g) {
                g = { category: cmd.category, items: [] };
                groups.push(g);
            }
            g.items.push({ cmd, index });
        });
        return groups;
    }, [filtered]);

    // Open with Ctrl/Cmd+K or the custom event fired by the visible Search buttons.
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (openRef.current) close();
                else show();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener(PALETTE_EVENT, show);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener(PALETTE_EVENT, show);
        };
    }, [show, close]);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const execute = useCallback(
        (cmd: CommandItem) => {
            setOpen(false);
            openerRef.current = null;
            cmd.action();
        },
        []
    );

    const activeId = filtered[selectedIndex] ? `${listId}-opt-${filtered[selectedIndex].id}` : undefined;

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Home") {
                e.preventDefault();
                setSelectedIndex(0);
            } else if (e.key === "End") {
                e.preventDefault();
                setSelectedIndex(Math.max(filtered.length - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
            } else if (e.key === "Escape") {
                e.preventDefault();
                close();
            } else if (e.key === "Tab") {
                // The input is the only focus stop inside the modal; keep focus there.
                e.preventDefault();
            }
        },
        [filtered, selectedIndex, execute, close]
    );

    // Keep the active option in view.
    useEffect(() => {
        if (!open || !activeId) return;
        document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }, [open, activeId]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        aria-hidden="true"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search the site"
                        className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-140 z-101"
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="bg-(--bg-surface-1) border border-(--border-default) rounded-xl shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-3 px-4 border-b border-(--border-default)">
                                <Search className="w-4 h-4 text-(--text-muted) shrink-0" aria-hidden="true" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    role="combobox"
                                    aria-expanded="true"
                                    aria-controls={listId}
                                    aria-activedescendant={activeId}
                                    aria-autocomplete="list"
                                    aria-label="Search projects, writing, decisions and pages"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search projects, writing, decisions…"
                                    className="flex-1 min-h-12 bg-transparent text-[15px] text-foreground placeholder:text-(--text-muted) outline-none font-mono"
                                />
                                <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-(--bg-surface-2) text-(--text-muted) border border-(--border-default)">
                                    Esc
                                </kbd>
                            </div>

                            <div id={listId} role="listbox" aria-label="Results" ref={listRef} className="max-h-90 overflow-y-auto py-2">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <div className="text-[14px] text-(--text-secondary)">No results found</div>
                                        <div className="text-[12px] text-(--text-muted) mt-1 font-mono">
                                            Try a project, technology or page name
                                        </div>
                                    </div>
                                ) : (
                                    grouped.map((group) => (
                                        <div key={group.category} role="group" aria-labelledby={`${listId}-g-${group.category}`}>
                                            <div
                                                id={`${listId}-g-${group.category}`}
                                                className="px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider text-(--text-muted)"
                                            >
                                                {group.category}
                                            </div>
                                            {group.items.map(({ cmd, index }) => {
                                                const isActive = index === selectedIndex;
                                                const Icon = cmd.icon;
                                                return (
                                                    <div
                                                        key={cmd.id}
                                                        id={`${listId}-opt-${cmd.id}`}
                                                        role="option"
                                                        aria-selected={isActive}
                                                        onClick={() => execute(cmd)}
                                                        onMouseMove={() => setSelectedIndex(index)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer",
                                                            isActive
                                                                ? "bg-(--accent-primary)/10 text-foreground"
                                                                : "text-(--text-secondary)"
                                                        )}
                                                    >
                                                        <Icon
                                                            className={cn("w-4 h-4 shrink-0", isActive ? "text-(--accent-primary)" : "text-(--text-muted)")}
                                                            aria-hidden="true"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[14px] truncate">{cmd.label}</div>
                                                            {cmd.sublabel && (
                                                                <div className="text-[12px] text-(--text-muted) font-mono truncate">{cmd.sublabel}</div>
                                                            )}
                                                        </div>
                                                        {isActive && <ArrowRight className="w-3 h-3 text-(--accent-primary) shrink-0" aria-hidden="true" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div role="status" aria-live="polite" className="sr-only">
                                {filtered.length === 0 ? "No results" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
                            </div>

                            <div className="px-4 py-2 border-t border-(--border-default) flex items-center justify-between gap-3 text-[11px] text-(--text-muted) font-mono">
                                <span>↑↓ navigate · Enter open</span>
                                <span className="flex items-center gap-1">
                                    <Command className="w-3 h-3" aria-hidden="true" />K toggles
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/** Visible trigger for the palette (also reachable with Ctrl/Cmd+K). */
export function PaletteButton({ className, compact = false }: { className?: string; compact?: boolean }) {
    if (compact) {
        return (
            <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
                aria-haspopup="dialog"
                aria-label="Search the site"
                className={cn(
                    "w-11 h-11 inline-flex items-center justify-center rounded-lg text-(--text-secondary) hover:text-(--accent-primary) hover:bg-(--bg-surface-2) transition-colors cursor-pointer",
                    className
                )}
            >
                <Search className="w-4 h-4" aria-hidden="true" />
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
            aria-haspopup="dialog"
            aria-label="Search the site (Ctrl or Command K)"
            className={cn(
                "inline-flex items-center gap-2 min-h-11 px-3 rounded-lg text-[13px] text-(--text-secondary) bg-(--bg-surface-2) border border-(--border-default) hover:border-(--border-hover) hover:text-foreground transition-colors cursor-pointer",
                className
            )}
        >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="flex-1 text-left font-mono">Search</span>
            <kbd className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-(--bg-surface-3) text-(--text-muted) border border-(--border-default)">
                Ctrl K
            </kbd>
        </button>
    );
}
