/**
 * The CORTEX mark: two nested open arcs (the C, and the layers of a cortex), a node at the
 * centre and a signal leaving through the opening. Drawn in currentColor so it follows the
 * palette; the tile around it is the caller's.
 */
export function CortexMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
            <path d="M17.95 6.65 A8 8 0 1 0 17.95 17.35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M15.16 9.16 A4.25 4.25 0 1 0 15.16 14.84" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="21" cy="12" r="1.3" fill="currentColor" />
        </svg>
    );
}
