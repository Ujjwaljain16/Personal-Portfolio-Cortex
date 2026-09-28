"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// The <html> class is the single source of truth. An inline script in the root
// layout applies the saved theme before first paint; this component only reads
// the class and toggles it.
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

const getIsLight = () => document.documentElement.classList.contains("light");
const getServerIsLight = () => false;

export function ThemeToggle({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
    const isLight = useSyncExternalStore(subscribe, getIsLight, getServerIsLight);

    function toggle() {
        const nextLight = !isLight;
        document.documentElement.classList.toggle("light", nextLight);
        try {
            // Key/shape shared with the inline script in app/layout.tsx.
            localStorage.setItem("pos-darkMode", JSON.stringify(!nextLight));
        } catch {
            /* storage unavailable: theme still applies for this session */
        }
    }

    const label = isLight ? "Switch to dark theme" : "Switch to light theme";
    const Icon = isLight ? Moon : Sun;

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={label}
            title={label}
            className={cn(
                "inline-flex items-center gap-2 rounded-lg text-(--text-secondary) hover:text-(--accent-primary) hover:bg-(--bg-surface-2) transition-colors",
                showLabel ? "px-3 py-2 text-[13px]" : "w-11 h-11 justify-center",
                className
            )}
        >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {showLabel && <span>{isLight ? "Dark theme" : "Light theme"}</span>}
        </button>
    );
}
