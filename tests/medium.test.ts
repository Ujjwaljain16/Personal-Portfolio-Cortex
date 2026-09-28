import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title><![CDATA[ Stories by Jainujjwal on Medium ]]></title>
<item>
<title><![CDATA[ A Deep Dive Into Something & Other Things ]]></title>
<link>https://medium.com/@jainujjwal1609/a-deep-dive-abc123?source=rss-f2441d6c5675------2</link>
<guid isPermaLink="false">https://medium.com/p/abc123</guid>
<category><![CDATA[ javascript ]]></category>
<category><![CDATA[ debugging ]]></category>
<dc:creator><![CDATA[ Jainujjwal ]]></dc:creator>
<pubDate>Fri, 04 Sep 2026 22:32:34 GMT</pubDate>
<content:encoded><![CDATA[ <p>${"word ".repeat(400)}This is the real first paragraph with more than two hundred and twenty characters so that the excerpt has to be truncated somewhere in the middle of a sentence rather than running on forever without end.</p> ]]></content:encoded>
</item>
<item>
<title><![CDATA[ Short One ]]></title>
<link>https://medium.com/@jainujjwal1609/short-one-xyz789</link>
<guid isPermaLink="false">https://medium.com/p/xyz789</guid>
<pubDate>Mon, 23 Feb 2026 22:39:48 GMT</pubDate>
<content:encoded><![CDATA[ <p>Quotes &quot;like this&quot; and an ampersand &amp; an apostrophe &#39;here&#39;.</p> ]]></content:encoded>
</item>
<item>
<title><![CDATA[ No content field ]]></title>
<link>https://medium.com/@jainujjwal1609/no-content-000</link>
<pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate>
</item>
<item>
<title><![CDATA[ Bad date ]]></title>
<link>https://medium.com/@jainujjwal1609/bad-date-111</link>
<pubDate>not a date</pubDate>
</item>
</channel>
</rss>`;

async function freshMedium() {
    vi.resetModules();
    return import("@/lib/medium");
}

beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("getMediumPosts", () => {
    it("parses title, link (tracking params stripped), date, tags, excerpt and read time", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 200 })));
        const { getMediumPosts } = await freshMedium();
        const posts = await getMediumPosts();

        expect(posts).toHaveLength(3); // the feed has 4 items; "Bad date" is dropped
        const first = posts[0];
        expect(first.title).toBe("A Deep Dive Into Something & Other Things");
        expect(first.url).toBe("https://medium.com/@jainujjwal1609/a-deep-dive-abc123");
        expect(first.published).toBe("2026-09-04");
        expect(first.tags).toEqual(["javascript", "debugging"]);
        expect(first.excerpt.length).toBeLessThanOrEqual(221);
        expect(first.excerpt.endsWith("…")).toBe(true);
        expect(first.readTime).toMatch(/^\d+ min read$/);
    });

    it("decodes HTML entities and strips tags in the excerpt", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 200 })));
        const { getMediumPosts } = await freshMedium();
        const posts = await getMediumPosts();
        const short = posts.find((p) => p.title === "Short One");
        expect(short?.excerpt).toBe(`Quotes "like this" and an ampersand & an apostrophe 'here'.`);
        expect(short?.excerpt).not.toContain("<p>");
    });

    it("handles an item with no content and gives it an empty excerpt and read time", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 200 })));
        const { getMediumPosts } = await freshMedium();
        const posts = await getMediumPosts();
        const bare = posts.find((p) => p.title === "No content field");
        expect(bare?.excerpt).toBe("");
        expect(bare?.readTime).toBe("");
    });

    it("skips an item with an unparseable date instead of failing the whole feed", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 200 })));
        const { getMediumPosts } = await freshMedium();
        const posts = await getMediumPosts();
        expect(posts.some((p) => p.title === "Bad date")).toBe(false);
    });

    it("returns an empty list, not a throw, when the feed request fails", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
        const { getMediumPosts } = await freshMedium();
        await expect(getMediumPosts()).resolves.toEqual([]);
    });

    it("does not parse the body of a non-200 response, even if it looks like a feed", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 503 })));
        const { getMediumPosts } = await freshMedium();
        await expect(getMediumPosts()).resolves.toEqual([]);
    });

    it("retries once after a network failure and still returns the feed", async () => {
        const fetchMock = vi.fn().mockRejectedValueOnce(new Error("ECONNRESET")).mockResolvedValueOnce(new Response(SAMPLE_FEED, { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
        const { getMediumPosts } = await freshMedium();
        const posts = await getMediumPosts();
        expect(posts).toHaveLength(3);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("gives up after two failures and returns an empty list", async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
        vi.stubGlobal("fetch", fetchMock);
        const { getMediumPosts } = await freshMedium();
        await expect(getMediumPosts()).resolves.toEqual([]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not request the feed more than once within the cache window", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(SAMPLE_FEED, { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
        const { getMediumPosts } = await freshMedium();
        await getMediumPosts();
        await getMediumPosts();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
