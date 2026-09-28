import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav";

/** Slim top bar for the landing page: brand plus the CORTEX modules. */
export function HomeHeader() {
    return (
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 border-b border-(--border-default)">
            <Link href="/" className="flex items-center gap-2 min-h-11">
                <span className="w-8 h-8 rounded-lg bg-(--accent-primary) flex items-center justify-center" aria-hidden="true">
                    <BrainCircuit className="w-5 h-5 text-white" />
                </span>
                <span className="text-sm font-semibold tracking-wider text-foreground">CORTEX</span>
            </Link>
            <nav aria-label="Primary" className="w-full sm:w-auto -mx-1 overflow-x-auto">
                <ul className="flex flex-nowrap gap-x-1 px-1 font-mono text-[13px] whitespace-nowrap">
                    {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className="inline-flex items-center min-h-11 px-2.5 rounded-md text-(--text-secondary) hover:text-(--accent-primary) hover:bg-(--bg-surface-2)"
                            >
                                /{item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
