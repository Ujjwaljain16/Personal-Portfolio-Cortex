import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "Writing",
    description: "Notes on integration complexity, a Unicode and Base64 bug, and how an MCP policy proxy works, including what it can't do yet.",
    path: "/blogs",
});

export default function BlogsPage() {
    return (
        <div className="space-y-8">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">WRITING</div>
                <h1 className="text-header mb-1">Engineering Blog</h1>
                <p className="text-[14px] text-(--text-secondary)">
                    Technical deep dives, architectural decisions, and learnings.
                </p>
            </header>

            <ul className="grid grid-cols-1 gap-4 max-w-3xl">
                {BLOG_POSTS.map((post) => (
                    <li key={post.slug}>
                        <article className="group relative surface-1 p-5 hover:border-(--border-hover) transition-colors">
                            <h2 className="text-lg font-medium text-foreground group-hover:text-(--accent-primary) transition-colors">
                                {/* Stretched link: the whole card is clickable, with a real accessible name. */}
                                <Link
                                    href={`/blogs/${post.slug}`}
                                    className="after:absolute after:inset-0 after:content-['']"
                                >
                                    {post.title}
                                </Link>
                            </h2>
                            <div className="mt-1 flex items-center gap-4 text-[12px] text-(--text-muted) font-mono">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" aria-hidden="true" />
                                    {post.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                    {post.readTime}
                                </span>
                            </div>
                            <p className="mt-3 text-[14px] text-(--text-secondary) leading-relaxed">{post.excerpt}</p>
                            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                                {post.tags.map((tag) => (
                                    <li
                                        key={tag}
                                        className="text-[11px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                                    >
                                        {tag}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </li>
                ))}
            </ul>
        </div>
    );
}
