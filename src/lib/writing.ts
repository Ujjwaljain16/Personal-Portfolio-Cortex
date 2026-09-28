import { BLOG_POSTS } from "@/data/blogPosts";
import { getMediumPosts, type MediumPost } from "@/lib/medium";

/**
 * The posts written for this site and the posts published on Medium, as one list.
 * A Medium post whose title matches a native one is left out: the native version is
 * usually a revised rewrite of the Medium original, and the two should not both appear
 * as separate entries.
 */

export interface WritingItem {
    title: string;
    date: string; // display string, e.g. "Feb 10, 2026"
    published: string; // ISO YYYY-MM-DD
    readTime: string;
    excerpt: string;
    tags: string[];
    href: string;
    external: boolean;
}

const normalise = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const displayDate = (iso: string) => dateFormatter.format(new Date(iso));

function fromNative(post: (typeof BLOG_POSTS)[number]): WritingItem {
    return {
        title: post.title,
        date: post.date,
        published: post.published,
        readTime: post.readTime,
        excerpt: post.excerpt,
        tags: post.tags,
        href: `/blogs/${post.slug}`,
        external: false,
    };
}

function fromMedium(post: MediumPost): WritingItem {
    return {
        title: post.title,
        date: displayDate(post.published),
        published: post.published,
        readTime: post.readTime,
        excerpt: post.excerpt,
        tags: post.tags,
        href: post.url,
        external: true,
    };
}

export async function getWritingItems(): Promise<WritingItem[]> {
    const nativeTitles = new Set(BLOG_POSTS.map((p) => normalise(p.title)));
    const medium = await getMediumPosts();
    const items = [...BLOG_POSTS.map(fromNative), ...medium.filter((p) => !nativeTitles.has(normalise(p.title))).map(fromMedium)];
    return items.sort((a, b) => b.published.localeCompare(a.published));
}
