"use client";

import { FileDown } from "lucide-react";

export function IdentityBlock() {
    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
                        Ujjwal Jain
                    </h1>
                    <p className="text-sm text-(--text-muted)">
                        Backend Engineer • Systems Builder • AI Infrastructure
                    </p>
                </div>
                <a
                    href="/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-mono bg-(--bg-surface-2) border border-(--border-default) text-(--text-secondary) hover:border-(--accent-primary) hover:text-(--accent-primary) transition-colors"
                >
                    <FileDown className="w-3.5 h-3.5" />
                    Resume
                </a>
            </div>
            <p className="text-[13px] text-(--text-secondary) max-w-130 leading-relaxed">
                Designing production-grade architectures focused on trust,
                performance, and developer tooling. This interface is the
                neural architecture behind my engineering work.
            </p>
            <p className="text-[12px] text-(--text-muted) font-mono">
                B.Tech CSE • VIT Bhopal • 2022–2026
            </p>
        </div>
    );
}
