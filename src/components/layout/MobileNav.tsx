"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Power,
    Activity,
    GitBranch,
    FlaskConical,
    Rocket,
    BookOpen,
    MessageSquare,
    Settings,
    Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "boot", icon: Power },
    { href: "/system", label: "system", icon: Activity },
    { href: "/decisions", label: "decisions", icon: GitBranch },
    { href: "/experiments", label: "experiments", icon: FlaskConical },
    { href: "/deployments", label: "deployments", icon: Rocket },
    { href: "/blogs", label: "blogs", icon: BookOpen },
    { href: "/ask", label: "ask", icon: MessageSquare },
];

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const close = useCallback(() => setOpen(false), []);


    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <>

            <div className="mobile-topbar">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-(--accent-primary) flex items-center justify-center">
                        <Cpu className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">PERSONAL.OS</span>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-(--bg-surface-2) transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5 text-(--text-secondary)" />
                </button>
            </div>


            <AnimatePresence>
                {open && (
                    <>

                        <motion.div
                            className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setOpen(false)}
                        />


                        <motion.aside
                            className="fixed top-0 left-0 bottom-0 w-70 bg-(--bg-surface-1) border-r border-(--border-default) z-101 flex flex-col"
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        >

                            <div className="p-4 border-b border-(--border-default) flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-(--accent-primary) flex items-center justify-center">
                                        <Cpu className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">PERSONAL.OS</div>
                                        <div className="text-[10px] text-(--text-muted) font-mono">v2.0.0</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--bg-surface-2) transition-colors"
                                    aria-label="Close navigation menu"
                                >
                                    <X className="w-4 h-4 text-(--text-muted)" />
                                </button>
                            </div>


                            <nav className="flex-1 py-4 overflow-y-auto">
                                <div className="text-label px-4 mb-2">MODULES</div>
                                <ul className="space-y-1 px-2">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={close}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                        isActive
                                                            ? "bg-(--bg-surface-2) text-(--accent-primary)"
                                                            : "text-(--text-secondary) hover:bg-(--bg-surface-2) hover:text-foreground"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>/{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>


                            <div className="border-t border-(--border-default) p-2">
                                <Link
                                    href="/settings"
                                    onClick={close}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                        pathname === "/settings"
                                            ? "bg-(--bg-surface-2) text-(--accent-primary)"
                                            : "text-(--text-secondary) hover:bg-(--bg-surface-2) hover:text-foreground"
                                    )}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>/settings</span>
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
