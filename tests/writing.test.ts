import { describe, expect, it, vi } from "vitest";
import { BLOG_POSTS } from "@/data/blogPosts";
import type { MediumPost } from "@/lib/medium";

vi.mock("@/lib/medium", () => ({ getMediumPosts: vi.fn() }));

async function itemsWith(mediumPosts: MediumPost[]) {
    const { getMediumPosts } = await import("@/lib/medium");
    vi.mocked(getMediumPosts).mockResolvedValue(mediumPosts);
    const { getWritingItems } = await import("@/lib/writing");
    return getWritingItems();
}

const medium = (over: Partial<MediumPost> = {}): MediumPost => ({
    title: "A Medium-only post",
    url: "https://medium.com/@jainujjwal1609/medium-only-post",
    published: "2026-01-01",
    excerpt: "An excerpt.",
    tags: ["testing"],
    readTime: "3 min read",
    ...over,
});

describe("getWritingItems", () => {
    it("includes every native post, each linked to its own page unless it has moved to Medium", async () => {
        const items = await itemsWith([]);
        for (const post of BLOG_POSTS) {
            const item = items.find((i) => i.title === post.title);
            expect(item, post.slug).toBeDefined();
            if (post.migratedTo) {
                expect(item?.href, post.slug).toBe(post.migratedTo);
                expect(item?.external, post.slug).toBe(true);
            } else {
                expect(item?.href, post.slug).toBe(`/blogs/${post.slug}`);
                expect(item?.external, post.slug).toBe(false);
            }
        }
    });

    it("has at least one migrated post to exercise that path (guards the test above against going stale)", () => {
        expect(BLOG_POSTS.some((p) => p.migratedTo)).toBe(true);
    });

    it("does not duplicate a migrated post even if the live Medium feed still carries it", async () => {
        const migrated = BLOG_POSTS.find((p) => p.migratedTo);
        if (!migrated) throw new Error("fixture needs a migrated post");
        const items = await itemsWith([medium({ title: migrated.title, url: migrated.migratedTo! })]);
        expect(items.filter((i) => i.title === migrated.title)).toHaveLength(1);
    });

    it("adds a Medium post that has no native match, linked out and marked external", async () => {
        const items = await itemsWith([medium()]);
        const item = items.find((i) => i.title === "A Medium-only post");
        expect(item).toBeDefined();
        expect(item?.href).toBe("https://medium.com/@jainujjwal1609/medium-only-post");
        expect(item?.external).toBe(true);
    });

    it("drops a Medium post whose title matches a native one, even with different case or punctuation", async () => {
        const native = BLOG_POSTS[0];
        const items = await itemsWith([medium({ title: native.title.toUpperCase().replace(/\./g, "!") })]);
        expect(items.filter((i) => i.title.toLowerCase() === native.title.toLowerCase())).toHaveLength(1);
        expect(items.find((i) => i.title.toLowerCase() === native.title.toLowerCase())?.external).toBe(false);
    });

    it("sorts newest first across both sources", async () => {
        const items = await itemsWith([medium({ title: "Way in the future", published: "2099-01-01" })]);
        expect(items[0].title).toBe("Way in the future");
    });

    it("still returns the native posts when the Medium feed is unavailable", async () => {
        const items = await itemsWith([]);
        expect(items.length).toBe(BLOG_POSTS.length);
    });
});
