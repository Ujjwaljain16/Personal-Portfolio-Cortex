import Link from "next/link";
import { AskInterface } from "@/components/ask/AskInterface";
import { pageMetadata } from "@/lib/seo";
import { validLinkPaths } from "@/lib/corpus";
import { projects } from "@/data/projects";
import { decisions, investigations } from "@/data/records";
import { mergedPRs } from "@/data/openSource";

export const metadata = pageMetadata({
    title: "Ask: Digital Ujjwal",
    description:
        "Talk to an AI version of me, built from my checked engineering record: what I've built, why, what went wrong, and how I'd approach problems I haven't solved yet.",
    path: "/ask",
});

/** The three kinds of statement an answer can contain, as the assistant is told to mark them (src/lib/askPrompt.ts). */
const KINDS = [
    { dot: "bg-(--accent-teal)", label: "Checked:", text: "from the record, with a link." },
    { dot: "bg-(--accent-primary)", label: "In my words:", text: "how I describe myself." },
    { dot: "bg-(--warning)", label: "Reasoning:", text: "how I'd approach something new." },
];

export default function AskPage() {
    const knows = [
        { label: "Projects", value: projects.length, href: "/projects" },
        { label: "Decisions", value: decisions.length, href: "/decisions" },
        { label: "Investigations", value: investigations.length, href: "/investigations" },
        { label: "Merged open-source PRs", value: mergedPRs.length, href: "/#open-source" },
    ];

    return (
        <div className="h-full min-h-0 grid gap-10 xl:grid-cols-[minmax(0,46rem)_18rem] xl:gap-14">
            <div className="flex h-full min-h-0 flex-col">
                <header className="mb-6 shrink-0 space-y-3 pt-2">
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">Ask · Digital Ujjwal</p>
                    <h1 className="text-[2rem] leading-[1.1] md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground">Ask me anything</h1>
                    <p className="text-[15.5px] md:text-[16.5px] leading-[1.6] text-(--text-secondary)">
                        Talk to an AI version of me, built from my checked engineering record: what I&apos;ve built, why I made the calls I
                        made, what went wrong, and how I&apos;d approach problems I haven&apos;t solved yet.
                    </p>
                    {/* The side panel carries the full disclosure on wide screens; this is its short form everywhere else. */}
                    <p className="font-mono text-[11.5px] text-(--text-muted) xl:hidden">An AI version of me, not me · it can be wrong</p>
                </header>
                <div className="flex-1 min-h-0">
                    <AskInterface allowedLinks={validLinkPaths()} />
                </div>
            </div>

            <aside aria-label="About Digital Ujjwal" className="hidden xl:block pt-2">
                <div className="space-y-8 rounded-3xl bg-(--bg-surface-1) p-7">
                    <section className="space-y-2.5">
                        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted)">What this is</h2>
                        <p className="text-[14px] leading-relaxed text-(--text-secondary)">
                            An AI version of me, built from this site&apos;s checked record. It speaks as me, but it isn&apos;t me, and it
                            can be wrong.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted)">What it knows</h2>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                            {knows.map((k) => (
                                <div key={k.label} className="flex flex-col">
                                    {/* Label first in the markup, number shown first. */}
                                    <dt className="order-2 mt-1.5 text-[12.5px] leading-snug text-(--text-muted)">
                                        <Link href={k.href} className="hover:text-foreground transition-colors">
                                            {k.label}
                                        </Link>
                                    </dt>
                                    <dd className="order-1 text-[24px] font-semibold leading-none tracking-[-0.02em] text-foreground tabular-nums">{k.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className="space-y-3">
                        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted)">Reading an answer</h2>
                        <ul className="space-y-2.5">
                            {KINDS.map((k) => (
                                <li key={k.label} className="flex items-start gap-2.5 text-[13px] leading-snug text-(--text-secondary)">
                                    <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${k.dot}`} aria-hidden="true" />
                                    <span>
                                        <span className="text-foreground">{k.label}</span> {k.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <a
                        href="mailto:jainujjwal1609@gmail.com"
                        className="inline-flex text-[13.5px] text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                    >
                        Talk to the real me
                    </a>
                </div>
            </aside>
        </div>
    );
}
