"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { BootSequence } from "@/components/landing/BootSequence";
import {
    Github,
    Linkedin,
    Mail,
    FileDown,
    ArrowRight,
    Activity,
} from "lucide-react";

/* ── Data ─────────────────────────────────────────── */

const TECH_STACK: { category: string; items: string[] }[] = [
    { category: "Languages", items: ["Java", "Python", "JavaScript", "TypeScript", "SQL", "HTML/CSS"] },
    { category: "Frontend", items: ["React", "React Native", "Next.js", "Tailwind CSS"] },
    { category: "Backend & Frameworks", items: ["Node.js", "Express.js", "Flask", "FastAPI"] },
    { category: "Databases", items: ["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Supabase", "Redis", "pgvector"] },
    { category: "DevOps & Tools", items: ["Git", "Docker", "GitHub Actions", "CI/CD", "Linux", "npm"] },
    { category: "Data & Libraries", items: ["pandas", "NumPy"] },
    { category: "Testing", items: ["Vitest", "Jest", "Playwright", "pytest"] },
];

const EXPERIENCE = [
    { role: "Open Source Contributor", org: "Appwrite", period: "Nov 2025", impact: "Fixed critical MFA recovery code validation bug in production auth flow (PR #10925)-implemented fix with comprehensive E2E test coverage, merged and deployed to production" },
    { role: "Open Source Contributor", org: "Vitest", period: "Jan 2026", impact: "Fixed test.only/describe.only execution bug preventing CI false passes (PR #9213)-refactored test collection logic with TypeScript improvements, merged after maintainer review" },
    { role: "Projects", org: "Self-directed", period: "2025 — Present", impact: "Built CampusSync (multi-org SaaS with 90+ REST APIs, Ed25519 signatures, dual OCR pipeline), Fuze (AI knowledge base with pgvector semantic search, 98% model loading optimization), and MigrateDB (published npm package with 100+ installs)" },
];

const PRINCIPLES = [
    "Understand the system - not just the framework",
    "Build it. Break it. Improve it.",
    "Read the docs before the shortcut",
    "If it isn’t shipped, it doesn’t exist",
    "Stay curious. Keep building.",
    "Be a good human",
];

/* ── Animation helpers ───────────────────────────── */

const stagger = (i: number, base: number = 0) => base + i * 0.08;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: stagger(i, 0.1), ease: [0.16, 1, 0.3, 1] },
    }),
};

const fadeLine: Variants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, delay: stagger(i, 0.05), ease: [0.16, 1, 0.3, 1] },
    }),
};

/* ── Page ─────────────────────────────────────────── */

// Track if this is the first mount of the session to prevent re-boot on client navigation
let isInitialMount = true;

export default function LandingPage() {
    // Skip boot for returning visitors
    // Use tri-state: null (checking), false (not booted), true (booted)
    const [booted, setBooted] = useState<boolean | null>(null);

    useEffect(() => {
        // Force boot on refresh (so user can re-trigger it), but keep storage for new tabs
        // Only check this on the very first mount of the application session
        if (isInitialMount) {
            isInitialMount = false;
            const navigation = window.performance?.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
            const isReload = navigation?.type === "reload";

            if (isReload) {
                // Defer state update to avoid synchronous render warning
                setTimeout(() => setBooted(false), 0);
                return;
            }
        }

        const hasBooted = localStorage.getItem("pos-booted-v2") === "true";
        setTimeout(() => setBooted(hasBooted), 0);
    }, []);

    const handleBootComplete = useCallback(() => {
        setBooted(true);
        try { localStorage.setItem("pos-booted-v2", "true"); } catch { }
    }, []);

    // Prevent hydration mismatch/flashing by waiting for mount check
    if (booted === null) {
        return null; // Or a simple loading spinner/black screen if desired
    }

    return (
        <>
            <AnimatePresence mode="wait">
                {!booted && <BootSequence onComplete={handleBootComplete} />}
            </AnimatePresence>

            <AnimatePresence>
                {booted && (
                    <motion.div
                        className="boot-fullscreen overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className="max-w-220 mx-auto px-6 md:px-10 py-16 md:py-24 space-y-20">

                            {/* ── Identity ────────────────────────── */}
                            <motion.section
                                initial="hidden"
                                animate="visible"
                                className="space-y-5"
                            >
                                <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-(--success) animate-pulse" />
                                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-(--text-muted)">
                                        system online
                                    </span>
                                </motion.div>

                                <motion.h1
                                    variants={fadeUp}
                                    custom={1}
                                    className="text-[36px] md:text-[48px] font-semibold tracking-tight text-foreground leading-[1.1]"
                                >
                                    Ujjwal Jain
                                </motion.h1>

                                <motion.p
                                    variants={fadeUp}
                                    custom={2}
                                    className="text-[15px] md:text-[17px] text-(--text-muted) font-mono"
                                >
                                    Backend Dev · Systems Tinkerer · Building with AI
                                </motion.p>

                                <motion.p
                                    variants={fadeUp}
                                    custom={3}
                                    className="text-[14px] text-(--text-secondary) max-w-140 leading-relaxed"
                                >
                                    I like building things and understanding how they work under the hood. Currently focused on backend
                                    systems, database tools, and developer infrastructure.
                                    Open source contributor and always looking for hard problems to solve.
                                </motion.p>

                                <motion.div variants={fadeUp} custom={4} className="flex items-center gap-4 pt-2">
                                    <span className="text-[12px] text-(--text-muted) font-mono">
                                        Bachelor&apos;s in Computer Science · BITS Pilani · 9.3 CGPA · 2024–2028
                                    </span>
                                    <a
                                        href="/resume.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono bg-(--bg-surface-2) border border-(--border-default) text-(--text-secondary) hover:border-(--accent-primary) hover:text-(--accent-primary) transition-colors"
                                    >
                                        <FileDown className="w-3 h-3" />
                                        Resume
                                    </a>
                                </motion.div>
                            </motion.section>

                            {/* ── Divider ─────────────────────────── */}
                            <motion.hr
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="border-(--border-default) opacity-30 origin-left"
                            />

                            {/* ── Enter System (modules) ─────────── */}
                            <motion.section
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-60px" }}
                                className="space-y-5"
                            >
                                <motion.div variants={fadeUp} custom={0} className="text-label">
                                    ENTER SYSTEM
                                </motion.div>
                                <motion.div variants={fadeUp} custom={1}>
                                    <Link
                                        href="/system"
                                        className="group flex items-center justify-between h-14 px-5 surface-1 rounded-lg hover:border-(--accent-primary) transition-colors max-w-[320px]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-4 h-4 text-(--accent-primary)" />
                                            <div>
                                                <div className="text-sm text-(--text-secondary) group-hover:text-foreground transition-colors">System Overview</div>
                                                <div className="text-[10px] text-(--text-muted) font-mono">Explore all modules</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-(--text-muted) group-hover:text-(--accent-primary) group-hover:translate-x-0.5 transition-all duration-150" />
                                    </Link>
                                </motion.div>
                            </motion.section>

                            {/* ── Experience ──────────────────────── */}
                            <motion.section
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-60px" }}
                                className="space-y-4"
                            >
                                <motion.div variants={fadeUp} custom={0}>
                                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none mb-3">────────────────────────</div>
                                    <div className="text-label">EXPERIENCE</div>
                                    <div className="text-[10px] uppercase tracking-[0.12em] text-(--text-muted) opacity-50 font-mono mt-1">
                                        ENGINEERING LOG
                                    </div>
                                </motion.div>
                                {EXPERIENCE.map((entry, i) => (
                                    <motion.div
                                        key={`${entry.role}-${entry.org}`}
                                        variants={fadeUp}
                                        custom={i + 1}
                                        className="surface-1 rounded-lg p-5 space-y-2"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="text-[14px] font-medium text-foreground">
                                                {entry.role}
                                                <span className="text-(--text-muted) font-normal"> - {entry.org}</span>
                                            </div>
                                            <span className="text-[11px] font-mono text-(--accent-primary) whitespace-nowrap shrink-0">
                                                {entry.period}
                                            </span>
                                        </div>
                                        <div className="text-[12px] text-(--text-secondary) leading-relaxed">
                                            {entry.impact}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.section>

                            {/* ── Tech Stack ──────────────────────── */}
                            <motion.section
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-60px" }}
                                className="space-y-6"
                            >
                                <motion.div variants={fadeUp} custom={0} className="text-label">
                                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none mb-3">────────────────────────</div>
                                    TECH STACK
                                </motion.div>
                                <div className="space-y-5">
                                    {TECH_STACK.map((group, gi) => (
                                        <motion.div key={group.category} variants={fadeUp} custom={gi + 1} className="space-y-2">
                                            <div className="text-[12px] font-medium text-(--text-secondary)">
                                                {group.category}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {group.items.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="text-[11px] px-3 py-1.5 rounded-md bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono tech-tag"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>

                            {/* ── Principles ──────────────────────── */}
                            <motion.section
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-60px" }}
                                className="space-y-3"
                            >
                                <motion.div variants={fadeUp} custom={0} className="text-label">
                                    <div className="text-[10px] font-mono text-(--border-default) tracking-[0.3em] select-none mb-3">────────────────────────</div>
                                    OPERATING PRINCIPLES
                                </motion.div>
                                <motion.ul className="space-y-2">
                                    {PRINCIPLES.map((p, i) => (
                                        <motion.li
                                            key={p}
                                            variants={fadeLine}
                                            custom={i}
                                            className="text-[12px] font-mono text-(--text-secondary) flex items-center gap-2.5"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-(--accent-primary) opacity-60 shrink-0" />
                                            {p}
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </motion.section>

                            {/* ── Contact Footer ─────────────────── */}
                            <motion.footer
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="pt-10 border-t border-(--border-default)/30 pb-8"
                            >
                                <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-6">
                                        <a href="https://github.com/Ujjwaljain16" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-(--text-muted) hover:text-(--accent-primary) transition-colors">
                                            <Github className="w-3.5 h-3.5" />
                                            <span className="font-mono">GitHub</span>
                                        </a>
                                        <a href="https://www.linkedin.com/in/ujjwal-jain-306b60323" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-(--text-muted) hover:text-(--accent-primary) transition-colors">
                                            <Linkedin className="w-3.5 h-3.5" />
                                            <span className="font-mono">LinkedIn</span>
                                        </a>
                                        <a href="mailto:jainujjwal1609@gmail.com" className="flex items-center gap-2 text-[12px] text-(--text-muted) hover:text-(--accent-primary) transition-colors">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="font-mono">Email</span>
                                        </a>
                                    </div>
                                    <a
                                        href="/resume.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono bg-(--bg-surface-2) border border-(--border-default) text-(--text-muted) hover:border-(--accent-primary) hover:text-(--accent-primary) transition-colors"
                                    >
                                        <FileDown className="w-3 h-3" />
                                        Download Resume
                                    </a>
                                </motion.div>

                                <motion.div
                                    variants={fadeUp}
                                    custom={1}
                                    className="mt-8 text-center text-[10px] font-mono text-(--text-muted) opacity-40 uppercase tracking-[0.2em]"
                                >
                                    CORTEX v2.0.0 — cognitive operating system
                                </motion.div>
                            </motion.footer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
