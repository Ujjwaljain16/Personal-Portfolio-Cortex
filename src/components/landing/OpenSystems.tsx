"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";

const HOVER_INTENT_MS = 250;

interface OpenSystem {
    name: string;
    desc: string;
    href: string;
    repo: string;
}

const SYSTEMS: OpenSystem[] = [
    {
        name: "AgentBrake",
        desc: "AI Safety Control Plane — MCP Proxy Firewall",
        href: "/system",
        repo: "https://github.com/Ujjwaljain16/AgentBrake",
    },
    {
        name: "CampusSync",
        desc: "Multi-tenant Credential Trust Infrastructure",
        href: "/system",
        repo: "https://github.com/Ujjwaljain16/CampusSync",
    },
    {
        name: "Fuze",
        desc: "AI Knowledge Intelligence Engine",
        href: "/system",
        repo: "https://github.com/Ujjwaljain16/Fuze",
    },
    {
        name: "migrateDB",
        desc: "TypeScript-first Database Migration Engine",
        href: "/system",
        repo: "https://www.npmjs.com/package/@ujjwaljain16/migratedb",
    },
    {
        name: "SheetSync",
        desc: "Resilient Spreadsheet → PostgreSQL ETL Pipeline",
        href: "/system",
        repo: "https://github.com/Ujjwaljain16/SheetSync",
    },
    {
        name: "E-commerce Backend",
        desc: "Distributed Microservices — Go · gRPC · Kafka",
        href: "/system",
        repo: "https://github.com/Ujjwaljain16/E-commerce-Backend",
    },
];

export function OpenSystems() {
    return (
        <div className="space-y-3 mt-10">
            <div className="text-label">OPEN SYSTEMS</div>
            <div className="divide-y divide-(--border-default)/40">
                {SYSTEMS.map((sys) => (
                    <SystemRow key={sys.name} system={sys} />
                ))}
            </div>
        </div>
    );
}

function SystemRow({ system }: { system: OpenSystem }) {
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const focusLocked = useSystemStore((s) => s.focusLocked);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activate = useCallback(() => {
        setContextContent({
            type: "markdown",
            content: `## ${system.name}\n\n${system.desc}`,
        });
    }, [system, setContextContent]);

    const handlePointerEnter = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        if (focusLocked) return;
        hoverTimerRef.current = setTimeout(activate, HOVER_INTENT_MS);
    }, [focusLocked, activate]);

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    return (
        <div
            className={cn(
                "group flex items-center justify-between h-9 px-1",
                "transition-colors duration-150"
            )}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            <Link
                href={system.href}
                className="text-[13px] text-(--text-secondary) group-hover:text-(--accent-primary) transition-colors font-medium"
            >
                {system.name}
            </Link>
            <div className="flex items-center gap-3">
                <span className="text-[11px] text-(--text-muted) font-mono truncate max-w-75 hidden sm:inline">
                    {system.desc}
                </span>
                <a
                    href={system.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-(--text-muted) hover:text-(--accent-primary) transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View ${system.name} source code`}
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}
