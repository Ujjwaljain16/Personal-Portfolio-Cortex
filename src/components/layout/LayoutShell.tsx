"use client";

import { MotionConfig } from "framer-motion";
import { CommandPalette } from "@/components/layout/CommandPalette";
import type { SearchEntry } from "@/lib/searchIndex";

const SkipLink = () => (
    <a href="#main" className="skip-link">
        Skip to content
    </a>
);

// The sidebar frame for inner pages lives in app/(site)/layout.tsx. Choosing it by route
// rather than by usePathname() keeps the prerendered HTML and the first client render identical.
export function LayoutShell({ children, searchEntries }: { children: React.ReactNode; searchEntries: SearchEntry[] }) {
    // MotionConfig makes every framer-motion animation honour the user's
    // reduced-motion setting (the CSS rule alone does not affect JS animations).
    return (
        <MotionConfig reducedMotion="user">
            <SkipLink />
            {children}
            <CommandPalette entries={searchEntries} />
        </MotionConfig>
    );
}
