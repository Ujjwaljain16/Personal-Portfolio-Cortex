"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CortexMark } from "@/components/brand/CortexMark";
import { cn } from "@/lib/utils";
import { CONTACT_LINKS, NAV_ITEMS, isActivePath } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PaletteButton } from "@/components/layout/CommandPalette";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar" aria-label="Sidebar">
            <div className="px-5 pt-6 pb-5">
                <Link href="/" className="group flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl bg-(--accent-primary) flex items-center justify-center transition-transform group-hover:scale-[1.04]"
                        aria-hidden="true"
                    >
                        <CortexMark className="w-[22px] h-[22px] text-(--background)" />
                    </div>
                    <div className="leading-tight">
                        <div className="text-[13px] font-semibold tracking-[0.18em] text-foreground">CORTEX</div>
                        <div className="mt-0.5 text-[12px] text-(--text-muted)">Ujjwal Jain</div>
                    </div>
                </Link>
            </div>

            <div className="px-4">
                <PaletteButton className="w-full" />
            </div>

            <nav aria-label="Primary" className="flex-1 pt-7 pb-4">
                <div className="px-5 mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Modules</div>
                <ul className="space-y-0.5">
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

            <div className="border-t border-(--border-default) px-3 py-3">
                <ul className="grid grid-cols-2 gap-x-2 px-2 pb-1 text-[12.5px] font-mono">
                    {CONTACT_LINKS.map((l) => (
                        <li key={l.label}>
                            <a
                                href={l.href}
                                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="inline-flex items-center min-h-8 text-(--text-muted) hover:text-foreground transition-colors"
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
