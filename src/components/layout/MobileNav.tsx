"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_LINKS, NAV_ITEMS, isActivePath } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Top bar (rendered first in the grid so it sits at the top) plus a
 * slide-in navigation dialog with Escape-to-close, a focus trap, and focus
 * restoration to the menu button.
 */
export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (!panel) return;
        const trigger = triggerRef.current;

        const focusables = () =>
            Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
        focusables()[0]?.focus();

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                return;
            }
            if (e.key !== "Tab") return;
            const els = focusables();
            if (els.length === 0) return;
            const first = els[0];
            const last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            trigger?.focus();
        };
    }, [open]);

    return (
        <>
            <header className="mobile-topbar">
                <Link href="/" className="flex items-center gap-2 min-h-11">
                    <div className="w-7 h-7 rounded-md bg-(--accent-primary) flex items-center justify-center" aria-hidden="true">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold tracking-wider text-foreground">CORTEX</span>
                </Link>
                <div className="flex items-center">
                    <ThemeToggle />
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setOpen(true)}
                        className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-(--bg-surface-2) transition-colors"
                        aria-label="Open navigation menu"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                    >
                        <Menu className="w-5 h-5 text-(--text-secondary)" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={close}
                            aria-hidden="true"
                        />

                        <motion.aside
                            ref={panelRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation"
                            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-(--bg-surface-1) border-r border-(--border-default) z-101 flex flex-col"
                            initial={{ x: -288 }}
                            animate={{ x: 0 }}
                            exit={{ x: -288 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        >
                            <div className="p-4 border-b border-(--border-default) flex items-center justify-between">
                                <div className="text-sm font-semibold tracking-wider text-foreground">CORTEX</div>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-(--bg-surface-2) transition-colors"
                                    aria-label="Close navigation menu"
                                >
                                    <X className="w-4 h-4 text-(--text-secondary)" aria-hidden="true" />
                                </button>
                            </div>

                            <nav aria-label="Primary" className="flex-1 py-4 overflow-y-auto">
                                <ul className="space-y-1 px-2">
                                    {NAV_ITEMS.map((item) => {
                                        const active = isActivePath(pathname, item.href);
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={close}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 min-h-11 rounded-lg text-[15px] transition-colors",
                                                        active
                                                            ? "bg-(--bg-surface-2) text-(--accent-primary)"
                                                            : "text-(--text-secondary) hover:bg-(--bg-surface-2) hover:text-foreground"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                                    <span>/{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>

                            <ul className="border-t border-(--border-default) p-2 grid grid-cols-2 gap-1">
                                {CONTACT_LINKS.map((l) => (
                                    <li key={l.label}>
                                        <a
                                            href={l.href}
                                            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                            className="flex items-center px-3 min-h-11 rounded-lg text-[14px] font-mono text-(--text-secondary) hover:bg-(--bg-surface-2) hover:text-(--accent-primary)"
                                        >
                                            {l.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
