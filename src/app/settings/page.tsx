"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
    Sun,
    Moon,
    Github,
    Linkedin,
    Mail,
    ExternalLink,
    Info,
    FileDown,
    Code2,
    Layers,
    Cpu,
    Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";

/* ── Animation Variants ────────────────────── */
const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
};

/* ── Sub-components ────────────────────────── */
interface SettingRowProps {
    label: string;
    description: string;
    children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-(--border-default)/40 last:border-0">
            <div>
                <div className="text-[13px] font-medium text-foreground">
                    {label}
                </div>
                <div className="text-[11px] text-(--text-muted) mt-0.5">{description}</div>
            </div>
            {children}
        </div>
    );
}

function Toggle({
    enabled,
    onToggle,
    iconOn,
    iconOff,
}: {
    enabled: boolean;
    onToggle: () => void;
    iconOn: React.ReactNode;
    iconOff: React.ReactNode;
}) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "relative w-14 h-7 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-primary)/50",
                enabled ? "bg-(--accent-primary)" : "bg-(--bg-surface-3)"
            )}
            aria-pressed={enabled}
        >
            <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
                animate={{ left: enabled ? "calc(100% - 26px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                <span className="text-background">
                    {enabled ? iconOn : iconOff}
                </span>
            </motion.div>
        </button>
    );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="w-7 h-7 rounded-md bg-(--bg-surface-2) flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-(--accent-primary)" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[11px] text-(--text-muted)">{label}</div>
                <div className="text-[13px] font-mono text-foreground">{value}</div>
            </div>
        </div>
    );
}

/* ── Data ───────────────────────────────────── */
const SYSTEM_INFO = [
    { label: "Version", value: "v2.0.0", icon: Info },
    { label: "Framework", value: "Next.js 16 · React 19", icon: Layers },
    { label: "Styling", value: "Tailwind CSS v4", icon: Paintbrush },
    { label: "Language", value: "TypeScript 5", icon: Code2 },
    { label: "Runtime", value: "Edge + Node.js", icon: Cpu },
];

const LINKS = [
    { label: "GitHub", handle: "@UjjwalJain16", url: "https://github.com/Ujjwaljain16", icon: Github },
    { label: "LinkedIn", handle: "ujjwal-jain", url: "https://www.linkedin.com/in/ujjwal-jain-306b60323", icon: Linkedin },
    { label: "Email", handle: "jainujjwal1609@gmail.com", url: "mailto:jainujjwal1609@gmail.com", icon: Mail },
];

/* ── Page ───────────────────────────────────── */
export default function SettingsPage() {
    const {
        darkMode,
        setDarkMode,
        hydrateSettings, setContextContent,
    } = useSystemStore();

    useEffect(() => { hydrateSettings(); }, [hydrateSettings]);

    useEffect(() => {
        setContextContent({
            type: "markdown",
            content: `## System Configuration

Preferences are persisted to local storage and restored on next visit.

### Active Settings
- **Theme**: ${darkMode ? "Dark" : "Light"}

---

*Settings are applied instantly and saved automatically.*`,
        });
    }, [darkMode, setContextContent]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8 max-w-2xl"
        >
            {/* ── Header ────────────────────────── */}
            <motion.div variants={fadeUp}>
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">CONFIG</div>
                <h1 className="text-header mb-1">Settings</h1>
                <p className="text-[13px] text-(--text-secondary)">
                    System preferences and configuration
                </p>
            </motion.div>

            {/* ── Appearance ────────────────────── */}
            <motion.section variants={fadeUp} className="surface-1 p-6 space-y-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none">────────────────────────</div>
                </div>
                <h2 className="text-label mb-4">APPEARANCE</h2>
                <SettingRow label="Dark Mode" description="Toggle dark / light theme">
                    <Toggle
                        enabled={darkMode}
                        onToggle={() => setDarkMode(!darkMode)}
                        iconOn={<Moon className="w-3.5 h-3.5" />}
                        iconOff={<Sun className="w-3.5 h-3.5" />}
                    />
                </SettingRow>
            </motion.section>

            {/* ── System Info ───────────────────── */}
            <motion.section variants={fadeUp} className="surface-1 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none">────────────────────────</div>
                </div>
                <h2 className="text-label mb-4">SYSTEM INFO</h2>
                <div className="divide-y divide-(--border-default)/30">
                    {SYSTEM_INFO.map((item) => (
                        <InfoRow key={item.label} label={item.label} value={item.value} icon={item.icon} />
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-(--border-default)/30">
                    <div className="text-[10px] font-mono text-(--text-muted) opacity-50">
                        BUILD 2026.02.10 · CORTEX SYSTEM
                    </div>
                </div>
            </motion.section>

            {/* ── Connect ──────────────────────── */}
            <motion.section variants={fadeUp} className="surface-1 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none">────────────────────────</div>
                </div>
                <h2 className="text-label mb-4">CONNECT</h2>
                <div className="space-y-2">
                    {LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg bg-(--bg-surface-2) hover:bg-(--bg-surface-3) hover:border-(--accent-primary) border border-transparent transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <link.icon className="w-4 h-4 text-(--text-muted) group-hover:text-(--accent-primary) transition-colors" />
                                <div>
                                    <span className="text-[13px] text-foreground block">
                                        {link.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-(--text-muted)">
                                        {link.handle}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-(--text-muted) group-hover:text-(--accent-primary) transition-colors" />
                        </a>
                    ))}
                </div>
                <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[11px] font-mono bg-(--bg-surface-2) border border-(--border-default) text-(--text-muted) hover:border-(--accent-primary) hover:text-(--accent-primary) transition-colors"
                >
                    <FileDown className="w-3.5 h-3.5" />
                    Download Resume
                </a>
            </motion.section>

            {/* ── About ────────────────────────── */}
            <motion.section variants={fadeUp} className="surface-1 p-6">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-(--accent-primary) mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-[13px] font-medium text-foreground mb-1">
                            About CORTEX
                        </h3>
                        <p className="text-[12px] text-(--text-secondary) leading-relaxed">
                            An engineering monitoring platform — live health checks,
                            architectural decisions, deployment observability, and system
                            metrics. Built and maintained by Ujjwal Jain.
                        </p>
                    </div>
                </div>
            </motion.section>
        </motion.div>
    );
}
