import { notFound } from "next/navigation";
import { renderCard, OG_SIZE } from "@/lib/ogCard";
import { BLOG_POSTS } from "@/data/blogPosts";

export const alt = "Article by Ujjwal Jain";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
    return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (!post) notFound();
    return renderCard({
        eyebrow: "WRITING",
        title: post.title,
        subtitle: post.excerpt,
        chips: [post.date, post.readTime],
    });
}
