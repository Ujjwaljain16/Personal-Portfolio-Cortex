import { projects } from "@/data/projects";
import { BLOG_POSTS } from "@/data/blogPosts";
import { decisions, investigations } from "@/data/records";

/**
 * The slim list the command palette searches. It is built on the server and
 * passed down as a prop, so the palette (mounted on every page) never imports
 * the full record, project or blog-post data into the client bundle.
 */

export type SearchCategory = "Projects" | "Writing" | "Decisions" | "Investigations";

export interface SearchEntry {
    id: string;
    label: string;
    sublabel: string;
    category: SearchCategory;
    href: string;
    keywords: string[];
}

export function buildSearchIndex(): SearchEntry[] {
    return [
        ...projects.map((p) => ({
            id: `proj-${p.id}`,
            label: p.name,
            sublabel: p.tagline,
            category: "Projects" as const,
            href: `/projects/${p.id}`,
            keywords: [...p.tech.map((t) => t.toLowerCase()), p.status],
        })),
        ...BLOG_POSTS.map((post) => ({
            id: `post-${post.slug}`,
            label: post.title,
            sublabel: post.date,
            category: "Writing" as const,
            href: `/blogs/${post.slug}`,
            keywords: post.tags.map((t) => t.toLowerCase()),
        })),
        ...decisions.map((d) => ({
            id: `dec-${d.id}`,
            label: d.title,
            sublabel: d.project,
            category: "Decisions" as const,
            href: `/decisions#${d.id}`,
            keywords: [d.project.toLowerCase(), d.status ?? ""],
        })),
        ...investigations.map((e) => ({
            id: `inv-${e.id}`,
            label: e.title,
            sublabel: e.project,
            category: "Investigations" as const,
            href: `/investigations#${e.id}`,
            keywords: [e.project.toLowerCase(), e.verdict ?? ""],
        })),
    ];
}
