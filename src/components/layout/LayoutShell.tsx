"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextPanel } from "@/components/layout/ContextPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isBoot = pathname === "/";

    if (isBoot) {
        return (
            <div className="boot-fullscreen">
                <CommandPalette />
                {children}
            </div>
        );
    }

    return (
        <div className="app-grid">
            <Sidebar />
            <main className="main-panel">{children}</main>
            <ContextPanel />
            <MobileNav />
            <CommandPalette />
        </div>
    );
}
