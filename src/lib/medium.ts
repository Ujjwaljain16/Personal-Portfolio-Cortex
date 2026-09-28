import "server-only";

/**
 * Server-only Medium access, over the profile's public RSS feed (Medium has no API for
 * this). The browser never fetches Medium. On any failure this returns an empty list
 * rather than throwing, so a Medium outage never breaks the /blogs page or the build.
 */

const FEED_URL = "https://medium.com/feed/@jainujjwal1609";
const REVALIDATE_SECONDS = 6 * 60 * 60; // Medium updates rarely; no need to check often
const EXCERPT_CHARS = 220;

export interface MediumPost {
    title: string;
    /** The Medium story URL, with tracking params stripped. */
    url: string;
    published: string; // ISO YYYY-MM-DD
    excerpt: string;
    tags: string[];
    /** Minutes, estimated from word count the same way the reading-time badge elsewhere does. */
    readTime: string;
}

function stripTracking(url: string): string {
    try {
        const u = new URL(url);
        u.search = "";
        return u.toString();
    } catch {
        return url;
    }
}

function textOf(html: string): string {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;|&rsquo;/g, "'")
        .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
        .replace(/&hellip;/g, "…")
        .replace(/&mdash;/g, "—")
        .replace(/\s+/g, " ")
        .trim();
}

function excerptOf(html: string): string {
    const text = textOf(html);
    if (text.length <= EXCERPT_CHARS) return text;
    const cut = text.slice(0, EXCERPT_CHARS);
    return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function readTimeOf(html: string): string {
    const words = textOf(html).split(" ").filter(Boolean).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
}

function tagOf(match: string): string | null {
    const m = /<category>\s*<!\[CDATA\[\s*([^\]]+?)\s*\]\]>\s*<\/category>/.exec(match);
    return m ? m[1] : null;
}

/** Minimal, dependency-free RSS parsing: Medium's feed shape is stable and this avoids an XML library. */
function parseFeed(xml: string): MediumPost[] {
    const posts: MediumPost[] = [];
    for (const itemMatch of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const item = itemMatch[1];
        const title = /<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/.exec(item)?.[1]?.trim();
        const link = /<link>([\s\S]*?)<\/link>/.exec(item)?.[1]?.trim();
        const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(item)?.[1]?.trim();
        const content = /<content:encoded>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content:encoded>/.exec(item)?.[1];
        if (!title || !link || !pubDate) continue;

        const date = new Date(pubDate);
        if (Number.isNaN(date.getTime())) continue;

        const tags = [...item.matchAll(/<category>[\s\S]*?<\/category>/g)].map((m) => tagOf(m[0])).filter((t): t is string => !!t);

        posts.push({
            title,
            url: stripTracking(link),
            published: date.toISOString().slice(0, 10),
            excerpt: content ? excerptOf(content) : "",
            tags,
            readTime: content ? readTimeOf(content) : "",
        });
    }
    return posts;
}

let cached: { at: number; posts: MediumPost[] } | null = null;

async function fetchFeed(): Promise<Response> {
    return fetch(FEED_URL, {
        // Medium's compressed response has been observed to reset the connection under
        // Node's fetch (undici) in some environments; asking for it uncompressed avoids
        // that. The feed is small, so the extra bytes do not matter.
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioBot/1.0)", "Accept-Encoding": "identity" },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(8000),
    });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMediumPosts(): Promise<MediumPost[]> {
    // A module-level cache in front of `fetch`'s own cache: this module is called from
    // several places while building one page, and there is no reason to parse the feed
    // more than once for the same request.
    if (cached && Date.now() - cached.at < REVALIDATE_SECONDS * 1000) return cached.posts;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await fetchFeed();
            if (!res.ok) {
                console.warn(`[medium] feed returned ${res.status}`);
                return cached?.posts ?? [];
            }
            const posts = parseFeed(await res.text());
            cached = { at: Date.now(), posts };
            return posts;
        } catch (err) {
            console.warn(`[medium] feed request failed (attempt ${attempt}):`, err instanceof Error ? err.message : "unknown error");
            if (attempt === 1) await sleep(500);
        }
    }
    return cached?.posts ?? [];
}
