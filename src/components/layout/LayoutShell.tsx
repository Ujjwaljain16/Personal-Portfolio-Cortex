"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    if (isHome) {
        return (
            <div className="boot-fullscreen">
                <CommandPalette />
                {children}
            </div>
        );
    }

    // DOM order matters: on small screens the top bar must be the first grid
    // child so it occupies the first row.
    return (
        <div className="app-grid">
            <MobileNav />
            <Sidebar />
            <main className="main-panel">{children}</main>
            <CommandPalette />
        </div>
    );
}
