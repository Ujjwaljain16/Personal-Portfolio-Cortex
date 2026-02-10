"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    Activity,
    GitBranch,
    FlaskConical,
    Rocket,
    BookOpen,
    Settings,
    MessageSquare,
    Power,
    BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "@/components/layout/StatusBar";

const navItems = [
    { href: "/", label: "boot", icon: Power },
    { href: "/system", label: "system", icon: Activity },
    { href: "/decisions", label: "decisions", icon: GitBranch },
    { href: "/experiments", label: "experiments", icon: FlaskConical },
    { href: "/deployments", label: "deployments", icon: Rocket },
    { href: "/blogs", label: "blogs", icon: BookOpen },
    { href: "/ask", label: "ask", icon: MessageSquare },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">

            <div className="p-4 border-b border-(--border-default)">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-(--accent-primary) flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold tracking-wider text-foreground">
                            CORTEX
                        </div>
                        <div className="text-[10px] text-(--text-muted) font-mono">
                            v2.0.0 // ujjwal.jain
                        </div>
                        <div className="text-[9px] text-(--text-muted) font-mono mt-1 opacity-60 leading-tight">
                            Cognitive Monitoring System
                        </div>
                    </div>
                </div>
            </div>


            <nav className="flex-1 py-4">
                <div className="text-label px-4 mb-2">MODULES</div>
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn("nav-item", isActive && "active")}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>/{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute left-0 w-0.5 h-4 bg-(--accent-primary) rounded-r"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>


            <div className="border-t border-(--border-default)">
                <Link href="/settings" className="nav-item my-2">
                    <Settings className="w-4 h-4" />
                    <span>/settings</span>
                </Link>
            </div>


            <div className="border-t border-(--border-default)">
                <StatusBar />
            </div>
        </aside>
    );
}
