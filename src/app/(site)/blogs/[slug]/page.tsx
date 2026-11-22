import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blogPosts";
import { Markdown } from "@/components/Markdown";
import { articleJsonLd, jsonLd, pageMetadata } from "@/lib/seo";

/** A post that used to have its own page here. Visiting it redirects to the list instead of 404ing. */
const REMOVED_POSTS: Record<string, string> = {
    "agent-brake-architecture": "/blogs", // removed from the site (Nov 2026); AgentBrake's project page covers the same ground
};

export function generateStaticParams() {
    return [...BLOG_POSTS.map((p) => ({ slug: p.slug })), ...Object.keys(REMOVED_POSTS).map((slug) => ({ slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post || post.migratedTo) return {};
    return pageMetadata({
        title: post.title,
        description: post.excerpt,
        path: `/blogs/${post.slug}`,
        type: "article",
        publishedTime: post.published,
        modifiedTime: post.updated ?? post.published,
        tags: post.tags,
        ownImage: true,
    });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) {
        if (REMOVED_POSTS[slug]) permanentRedirect(REMOVED_POSTS[slug]);
        notFound();
    }
    // This post's home moved to Medium; the archived `content` below is never rendered.
    if (post.migratedTo) permanentRedirect(post.migratedTo);

    return (
        <div className="pb-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd(post)) }} />
            {/* A reading column, as on the project pages: about 70 characters a line. */}
            <div className="max-w-[44rem]">
                <header className="space-y-6 pb-10 mb-10 border-b border-(--border-default)">
                    <Link
                        href="/blogs"
                        className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-muted) hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                        All writing
                    </Link>
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">{post.tags.slice(0, 3).join(" · ")}</p>
                    <h1 className="text-[2.1rem] leading-[1.1] md:text-[2.75rem] font-semibold tracking-[-0.03em] text-foreground">{post.title}</h1>
                    {post.excerpt && <p className="text-[18px] md:text-[19px] leading-[1.55] text-(--text-secondary)">{post.excerpt}</p>}
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[12px] text-(--text-muted)">
                        <time dateTime={post.published}>{post.date}</time>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                        <span aria-hidden="true">·</span>
                        <span>Ujjwal Jain</span>
                    </p>
                </header>

                <article>
                    <Markdown>{post.content}</Markdown>
                </article>

                <footer className="mt-16 border-t border-(--border-default) pt-6">
                    <Link
                        href="/blogs"
                        className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-muted) hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        All writing
                    </Link>
                </footer>
            </div>
        </div>
    );
}
