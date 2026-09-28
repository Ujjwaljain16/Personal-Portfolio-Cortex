import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BLOG_POSTS } from "@/data/blogPosts";
import { projects } from "@/data/projects";

/**
 * `lastModified` is only set where a real date exists (blog posts). Other
 * pages omit it rather than claiming they changed today.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const pages: MetadataRoute.Sitemap = [
        { url: SITE_URL, priority: 1 },
        { url: `${SITE_URL}/projects`, priority: 0.9 },
        { url: `${SITE_URL}/blogs`, priority: 0.7 },
        { url: `${SITE_URL}/decisions`, priority: 0.7 },
        { url: `${SITE_URL}/investigations`, priority: 0.6 },
        { url: `${SITE_URL}/deployments`, priority: 0.6 },
        { url: `${SITE_URL}/system`, priority: 0.4 },
        { url: `${SITE_URL}/ask`, priority: 0.5 },
    ];

    const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
        url: `${SITE_URL}/projects/${p.id}`,
        priority: p.tier === "flagship" ? 0.8 : 0.6,
    }));

    const postPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
        url: `${SITE_URL}/blogs/${post.slug}`,
        lastModified: post.updated ?? post.published,
        priority: 0.6,
    }));

    return [...pages, ...projectPages, ...postPages];
}
