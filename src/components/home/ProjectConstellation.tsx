"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * CORTEX: my projects as a small network around a centre node. Hovering, focusing or clicking a node selects it and the
 * panel underneath shows what it is and its one headline number, with a link to the case study. Until someone
 * interacts, the selection drifts slowly from node to node (not for anyone who prefers reduced motion).
 * The page passes plain data in, so the full project module never reaches the client bundle.
 */

export interface ConstellationNode {
    id: string;
    name: string;
    tagline: string;
    status: string;
    value?: string;
    label?: string;
    major: boolean;
}

type Pos = { x: number; y: number; anchor: "start" | "middle" | "end"; dy: number };

// Hand-placed in a 560 x 440 box. Flagships on the inner ring; newer tools orbit outside and are labelled on selection only.
const POS: Record<string, Pos> = {
    fuze: { x: 150, y: 100, anchor: "middle", dy: -22 },
    campussync: { x: 405, y: 88, anchor: "middle", dy: -22 },
    warrant: { x: 480, y: 236, anchor: "end", dy: 36 },
    campusslot: { x: 382, y: 372, anchor: "middle", dy: 36 },
    "sse-observatory": { x: 162, y: 362, anchor: "middle", dy: 36 },
    minidb: { x: 78, y: 232, anchor: "start", dy: 36 },
    agentbrake: { x: 285, y: 18, anchor: "middle", dy: -12 },
    recoveryos: { x: 546, y: 150, anchor: "end", dy: -12 },
    vaulttabs: { x: 24, y: 388, anchor: "start", dy: 24 },
};
const LINK_TO: Record<string, string> = { agentbrake: "fuze", recoveryos: "warrant", vaulttabs: "sse-observatory" };
const CENTER = { x: 280, y: 232 };
const RING = ["fuze", "campussync", "warrant", "campusslot", "sse-observatory", "minidb"];

export function ProjectConstellation({ nodes }: { nodes: ConstellationNode[] }) {
    const placed = nodes.filter((n) => POS[n.id]);
    const majors = placed.filter((n) => n.major);
    const [selected, setSelected] = useState(majors[0]?.id ?? placed[0]?.id);
    const [touched, setTouched] = useState(false);

    // Gentle auto-tour until the visitor takes over.
    const tour = majors.map((m) => m.id).join(",");
    useEffect(() => {
        const ids = tour.split(",");
        if (touched || ids.length < 2) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const t = window.setInterval(() => {
            setSelected((cur) => ids[(ids.indexOf(cur ?? "") + 1) % ids.length]);
        }, 3800);
        return () => window.clearInterval(t);
    }, [touched, tour]);

    const pick = (id: string) => {
        setTouched(true);
        setSelected(id);
    };
    const current = placed.find((n) => n.id === selected) ?? placed[0];
    const ring = RING.filter((id) => placed.some((n) => n.id === id));

    return (
        <div className="constellation mx-auto w-full max-w-[36rem]">
            <svg viewBox="0 0 560 440" className="w-full h-auto overflow-visible" aria-hidden="false" role="group" aria-label="CORTEX project graph">
                <defs>
                    <radialGradient id="cx-core" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                <circle cx={CENTER.x} cy={CENTER.y} r="186" className="cx-orbit" />

                {ring.map((id, i) => {
                    const a = POS[id];
                    const b = POS[ring[(i + 1) % ring.length]];
                    return <line key={`r-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="cx-ring" />;
                })}
                {placed
                    .filter((n) => !n.major && LINK_TO[n.id])
                    .map((n) => {
                        const a = POS[n.id];
                        const b = POS[LINK_TO[n.id]];
                        return <line key={`m-${n.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="cx-ring cx-ring-faint" />;
                    })}
                {majors.map((n, i) => {
                    const p = POS[n.id];
                    const on = n.id === selected;
                    return (
                        <g key={`s-${n.id}`}>
                            <line x1={CENTER.x} y1={CENTER.y} x2={p.x} y2={p.y} className={on ? "cx-spoke is-on" : "cx-spoke"} />
                            <line
                                x1={CENTER.x}
                                y1={CENTER.y}
                                x2={p.x}
                                y2={p.y}
                                className="cx-edge"
                                style={{ animationDelay: `${i * -1.3}s` }}
                            />
                        </g>
                    );
                })}

                <circle cx={CENTER.x} cy={CENTER.y} r="92" fill="url(#cx-core)" className="cx-core-glow" />
                <circle cx={CENTER.x} cy={CENTER.y} r="26" className="cx-core-ring" />
                <circle cx={CENTER.x} cy={CENTER.y} r="6" className="cx-core-dot" />
                <text x={CENTER.x} y={CENTER.y + 48} textAnchor="middle" className="cx-core-label">
                    CORTEX
                </text>

                {placed.map((n) => {
                    const p = POS[n.id];
                    const on = n.id === selected;
                    return (
                        <g
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={on}
                            aria-label={`Show ${n.name}`}
                            className={`cx-node${n.major ? "" : " cx-node-minor"}${on ? " is-on" : ""}`}
                            onMouseEnter={() => pick(n.id)}
                            onFocus={() => pick(n.id)}
                            onClick={() => pick(n.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    pick(n.id);
                                }
                            }}
                        >
                            <circle cx={p.x} cy={p.y} r={n.major ? 28 : 20} className="cx-node-hit" />
                            <circle cx={p.x} cy={p.y} r={n.major ? 16 : 10} className="cx-node-halo" />
                            <circle cx={p.x} cy={p.y} r={n.major ? 5.5 : 3.5} className="cx-node-dot" />
                            <text x={p.x} y={p.y + p.dy} textAnchor={p.anchor} className="cx-label">
                                {n.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {current && (
                <div className="cx-panel mt-2" aria-live="polite">
                    <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[15px] font-semibold text-foreground">{current.name}</p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-(--text-muted)">{current.status}</p>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-(--text-secondary) line-clamp-2">{current.tagline}</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                        {current.value ? (
                            <p className="min-w-0">
                                <span className="block font-mono text-[17px] font-semibold text-foreground tabular-nums">{current.value}</span>
                                <span className="block text-[12px] leading-snug text-(--text-muted) line-clamp-1">{current.label}</span>
                            </p>
                        ) : (
                            <span />
                        )}
                        <Link
                            href={`/projects/${current.id}`}
                            className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[12px] text-(--accent-primary) hover:underline"
                        >
                            Case study
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
