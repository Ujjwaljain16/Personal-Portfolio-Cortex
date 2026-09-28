import Link from "next/link";
import { Calendar, Clock, ArrowUpRight } from "lucide-react";
import { getWritingItems } from "@/lib/writing";
import { pageMetadata } from "@/lib/seo";

// The Medium feed is fetched with its own long revalidate window (src/lib/medium.ts); this
// only needs to be at least that often, so the page checks for new posts without a rebuild.
export const revalidate = 3600;

export const metadata = pageMetadata({
    title: "Writing",
    description: "Technical deep dives and post-mortems, written here and on Medium: integration complexity, a Unicode bug, an MCP policy proxy, and more.",
    path: "/blogs",
});

export default async function BlogsPage() {
    const items = await getWritingItems();

    return (
        <div className="space-y-8">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">WRITING</div>
                <h1 className="text-header mb-1">Engineering Blog</h1>
                <p className="text-[14px] text-(--text-secondary)">
                    Technical deep dives, architectural decisions, and learnings. Some are written for this site, the
                    rest are on{" "}
                    <a
                        href="https://medium.com/@jainujjwal1609"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--accent-primary) underline underline-offset-2 hover:opacity-80"
                    >
                        Medium ↗
                    </a>
                    .
                </p>
            </header>

            <ul className="grid grid-cols-1 gap-4 max-w-3xl">
                {items.map((item) => (
                    <li key={item.href}>
                        <article className="group relative surface-1 p-5 hover:border-(--border-hover) transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-medium text-foreground group-hover:text-(--accent-primary) transition-colors">
                                    {/* Stretched link: the whole card is clickable, with a real accessible name. */}
                                    {item.external ? (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="after:absolute after:inset-0 after:content-['']"
                                        >
                                            {item.title}
                                        </a>
                                    ) : (
                                        <Link href={item.href} className="after:absolute after:inset-0 after:content-['']">
                                            {item.title}
                                        </Link>
                                    )}
                                </h2>
                                {item.external && (
                                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-(--text-muted)">
                                        Medium
                                        <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-[12px] text-(--text-muted) font-mono">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" aria-hidden="true" />
                                    {item.date}
                                </span>
                                {item.readTime && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" aria-hidden="true" />
                                        {item.readTime}
                                    </span>
                                )}
                            </div>
                            {item.excerpt && <p className="mt-3 text-[14px] text-(--text-secondary) leading-relaxed">{item.excerpt}</p>}
                            {item.tags.length > 0 && (
                                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                                    {item.tags.map((tag) => (
                                        <li
                                            key={tag}
                                            className="text-[11px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                                        >
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    </li>
                ))}
            </ul>
        </div>
    );
}
