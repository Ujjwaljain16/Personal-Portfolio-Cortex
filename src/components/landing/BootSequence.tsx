"use client";

import { useEffect } from "react";

const BOOT_LINES = [
    "initializing CORTEX ............ ok",
    "mounting projects .............. ok",
    "mounting writing ............... ok",
    "opening exploration shell ...... ok",
];

const AUTO_DISMISS_MS = 1500;

/** Set before first paint by the inline script in app/layout.tsx. */
function skip() {
    try {
        localStorage.setItem("pos-booted-v3", "1");
    } catch {
        /* storage unavailable: it will simply play again next visit */
    }
    document.documentElement.dataset.boot = "skip";
}

/**
 * Decorative first-visit overlay. The page content is already in the HTML
 * underneath, so nothing is ever blocked: the overlay dismisses itself after
 * ~1.5s, on click or Escape, plays once per browser, and never plays for
 * reduced-motion users (the layout script pre-marks the page as skipped).
 * Visibility is driven by `html[data-boot="skip"]` in globals.css.
 */
export function BootOverlay() {
    useEffect(() => {
        if (document.documentElement.dataset.boot === "skip") return;

        const timer = setTimeout(skip, AUTO_DISMISS_MS);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") skip();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <div className="boot-overlay" aria-hidden="true" onClick={skip}>
            <div className="w-full max-w-md px-6 font-mono text-[13px]">
                <div className="mb-5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-(--danger) opacity-80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-(--warning) opacity-80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-(--success) opacity-80" />
                    <span className="ml-2 text-[11px] text-(--text-muted)">cortex — boot</span>
                </div>
                <div className="space-y-1.5 text-(--text-secondary)">
                    {BOOT_LINES.map((line, i) => (
                        <div key={line} className="boot-line" style={{ animationDelay: `${i * 220}ms` }}>
                            {line}
                        </div>
                    ))}
                    <div className="boot-line text-(--success)" style={{ animationDelay: `${BOOT_LINES.length * 220}ms` }}>
                        ready.
                    </div>
                </div>
                <div className="mt-6 text-[11px] text-(--text-muted)">click or press Esc to skip</div>
            </div>
        </div>
    );
}
