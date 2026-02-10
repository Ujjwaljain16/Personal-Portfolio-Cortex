"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Activity,
    GitBranch,
    FlaskConical,
    Rocket,
    BookOpen,
    ArrowRight,
    type LucideIcon,
} from "lucide-react";

interface ModuleEntry {
    href: string;
    label: string;
    icon: LucideIcon;
}

const MODULES: ModuleEntry[] = [
    { href: "/system", label: "System Overview", icon: Activity },
    { href: "/decisions", label: "Architectural Decisions", icon: GitBranch },
    { href: "/experiments", label: "Experiment Lab", icon: FlaskConical },
    { href: "/deployments", label: "Deployment Signals", icon: Rocket },
    { href: "/blogs", label: "Engineering Blog", icon: BookOpen },
];

export function SystemEntryGrid() {
    return (
        <div className="space-y-3 mt-6">
            <div className="text-label">ENTER SYSTEM</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODULES.map((mod) => (
                    <LandingModuleCard key={mod.href} {...mod} />
                ))}
            </div>
        </div>
    );
}

function LandingModuleCard({ href, label, icon: Icon }: ModuleEntry) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center justify-between h-14 px-4",
                "surface-1 rounded-lg cursor-pointer",
                "transition-colors duration-150",
                "hover:border-(--border-hover)"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-(--text-muted) group-hover:text-(--accent-primary) transition-colors" />
                <span className="text-sm text-(--text-secondary) group-hover:text-foreground transition-colors">
                    {label}
                </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-(--text-muted) opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
        </Link>
    );
}
