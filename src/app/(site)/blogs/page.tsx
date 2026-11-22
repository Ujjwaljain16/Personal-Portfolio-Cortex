import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getWritingItems } from "@/lib/writing";
import { pageMetadata } from "@/lib/seo";

// The Medium feed is fetched with its own long revalidate window (src/lib/medium.ts); this
// only needs to be at least that often, so the page checks for new posts without a rebuild.
export const revalidate = 3600;

export const metadata = pageMetadata({
    title: "Writing",
    description: "Technical deep dives and post-mortems on Medium: a GiST index Postgres ignored, a Unicode bug, shipping a PWA, and more.",
    path: "/blogs",
});

export default async function BlogsPage() {
    const items = await getWritingItems();
    const onMedium = items.filter((i) => i.external).length;
    const onSite = items.length - onMedium;

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-12">
                <header className="space-y-5 pt-2">
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">Writing</p>
                    <h1 className="text-[2.5rem] leading-[1.05] md:text-[3.25rem] font-semibold tracking-[-0.035em] text-foreground">Writing</h1>
                    <p className="max-w-[44rem] text-[17px] md:text-[18px] leading-[1.6] text-(--text-secondary)">
                        Technical deep dives and post-mortems: what I built, what broke and what I learned.
                        {onSite > 0 ? " Some are written for this site; the rest are on " : " They are published on "}
                        <a
                            href="https://medium.com/@jainujjwal1609"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)"
                        >
                            Medium
                        </a>
                        .
                    </p>
                    <p className="font-mono text-[12px] text-(--text-muted)">
                        {items.length} {items.length === 1 ? "post" : "posts"}
                        {onSite > 0 ? ` · ${onSite} on this site · ${onMedium} on Medium` : ", all on Medium"}
                    </p>
                </header>

                <ol className="record-list border-t border-(--border-default)">
                    {items.map((item) => (
                        <li key={item.href}>
                            <article className="group relative grid gap-2 py-7 px-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-10">
                                <div className="min-w-0 space-y-2.5">
                                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11.5px] text-(--text-muted)">
                                        <time dateTime={item.published}>{item.date}</time>
                                        {item.readTime && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>{item.readTime}</span>
                                            </>
                                        )}
                                    </p>
                                    <h2 className="text-[20px] md:text-[22px] font-semibold leading-snug tracking-[-0.015em] text-foreground group-hover:text-(--accent-primary) transition-colors">
                                        {/* Stretched link: the whole row is clickable, with a real accessible name. */}
                                        {item.external ? (
                                            <a href={item.href} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 after:content-['']">
                                                {item.title}
                                            </a>
                                        ) : (
                                            <Link href={item.href} className="after:absolute after:inset-0 after:content-['']">
                                                {item.title}
                                            </Link>
                                        )}
                                    </h2>
                                    {item.excerpt && <p className="max-w-[46rem] text-[15px] leading-relaxed text-(--text-secondary)">{item.excerpt}</p>}
                                    {item.tags.length > 0 && (
                                        <p className="font-mono text-[11.5px] text-(--text-muted)" aria-label="Tags">
                                            {item.tags.slice(0, 5).join(" · ")}
                                        </p>
                                    )}
                                </div>
                                <span className="inline-flex items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-[0.12em] text-(--text-muted) sm:pt-0.5">
                                    {item.external ? "On Medium" : "On this site"}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </article>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
