"use client";

import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";

const SkipLink = () => (
    <a href="#main" className="skip-link">
        Skip to content
    </a>
);

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    // MotionConfig makes every framer-motion animation honour the user's
    // reduced-motion setting (the CSS rule alone does not affect JS animations).
    return (
        <MotionConfig reducedMotion="user">
            <SkipLink />
            {isHome ? (
                // The home page renders its own <main id="main">.
                <div className="boot-fullscreen">
                    <CommandPalette />
                    {children}
                </div>
            ) : (
                // DOM order matters: on small screens the top bar must be the first
                // grid child so it occupies the first row.
                <div className="app-grid">
                    <MobileNav />
                    <Sidebar />
                    <main id="main" tabIndex={-1} className="main-panel">
                        {children}
                    </main>
                    <CommandPalette />
                </div>
            )}
        </MotionConfig>
    );
}
