import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blogPosts";
import { Markdown } from "@/components/Markdown";
import { articleJsonLd, jsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
    return BLOG_POSTS.map((p) => ({ slug: p.slug }));
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
    if (!post) notFound();
    // This post's home moved to Medium; the archived `content` below is never rendered.
    if (post.migratedTo) permanentRedirect(post.migratedTo);

    return (
        <div className="max-w-3xl pb-10">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd(post)) }} />
            <header className="mb-8">
                <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 min-h-11 text-[13px] font-mono text-(--text-secondary) hover:text-(--accent-primary) transition-colors group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                    All posts
                </Link>

                <ul className="flex flex-wrap gap-2 mt-4 mb-4" aria-label="Tags">
                    {post.tags.map((tag) => (
                        <li
                            key={tag}
                            className="text-[11px] px-2 py-1 rounded bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default) font-mono"
                        >
                            {tag}
                        </li>
                    ))}
                </ul>

                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
                    {post.title}
                </h1>

                <div className="flex items-center gap-6 text-[13px] text-(--text-muted) font-mono pb-6 border-b border-(--border-default)">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {post.readTime}
                    </span>
                </div>
            </header>

            <article>
                <Markdown>{post.content}</Markdown>
            </article>
        </div>
    );
}
