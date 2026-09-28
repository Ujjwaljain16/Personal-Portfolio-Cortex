"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_LINKS, NAV_ITEMS, isActivePath } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar" aria-label="Sidebar">
            <div className="p-4 border-b border-(--border-default)">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-(--accent-primary) flex items-center justify-center" aria-hidden="true">
                        <BrainCircuit className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold tracking-wider text-foreground">CORTEX</div>
                        <div className="text-[11px] text-(--text-muted) font-mono">Ujjwal Jain</div>
                    </div>
                </Link>
            </div>

            <nav aria-label="Primary" className="flex-1 py-4">
                <div className="text-label px-4 mb-2">MODULES</div>
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const active = isActivePath(pathname, item.href);
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn("nav-item", active && "active")}
                                >
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                    <span>/{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-(--border-default) p-2">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[13px] font-mono">
                    {CONTACT_LINKS.map((l) => (
                        <li key={l.label}>
                            <a
                                href={l.href}
                                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="text-(--text-secondary) hover:text-(--accent-primary)"
                            >
                                {l.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <ThemeToggle showLabel className="w-full" />
            </div>
        </aside>
    );
}
