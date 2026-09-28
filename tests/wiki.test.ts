import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askWiki, resetWikiState, McpToolError } from "@/lib/wiki";

const REPOS = ["o/Alpha", "o/Beta", "o/Gamma"];
const MISSING = "o/Beta";

/** A fake retrieval service: repos in `missing` are "not indexed", the rest answer with their own name. */
function fakeService({ missing = [MISSING], failWith }: { missing?: string[]; failWith?: Error } = {}) {
    const calls: string[][] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
        if (failWith) throw failWith;
        const args = JSON.parse(String(init.body)).params.arguments as { repoName: string[] };
        calls.push(args.repoName);
        const notFound = args.repoName.some((r) => missing.includes(r));
        const text = notFound
            ? `Error processing question: Repository not found. Requested repos: ${args.repoName.join(", ")}`
            : `answer from ${args.repoName.join("+")}`;
        const body = JSON.stringify({ jsonrpc: "2.0", id: "1", result: { isError: notFound, content: [{ type: "text", text }] } });
        return new Response(`event: message\ndata: ${body}\n\n`, { status: 200, headers: { "content-type": "text/event-stream" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    return { calls, fetchMock };
}

beforeEach(() => {
    resetWikiState();
    vi.stubEnv("DEVIN_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("askWiki", () => {
    it("makes a single call when every repository is indexed", async () => {
        const { calls } = fakeService({ missing: [] });
        const answer = await askWiki("q", REPOS);
        expect(calls).toEqual([REPOS]);
        expect(answer.repos).toEqual(REPOS);
    });

    it("skips a repository that is not indexed and answers from the rest", async () => {
        const { calls } = fakeService();
        const answer = await askWiki("q", REPOS);
        expect(answer.repos).toEqual(["o/Alpha", "o/Gamma"]);
        expect(answer.text).toContain("answer from o/Alpha");
        expect(answer.text).toContain("answer from o/Gamma");
        expect(answer.text).not.toContain("Repository not found");
        // one combined attempt, then one call per repository
        expect(calls).toHaveLength(1 + REPOS.length);
    });

    it("remembers the missing repository and leaves it out of later requests", async () => {
        const { calls } = fakeService();
        await askWiki("first", REPOS);
        calls.length = 0;
        const second = await askWiki("second", REPOS);
        expect(calls).toEqual([["o/Alpha", "o/Gamma"]]);
        expect(second.repos).toEqual(["o/Alpha", "o/Gamma"]);
    });

    it("forgets after the time-to-live so a newly indexed repository comes back", async () => {
        vi.useFakeTimers();
        try {
            fakeService();
            await askWiki("first", REPOS);
            vi.advanceTimersByTime(60 * 60 * 1000 + 1);
            const { calls } = fakeService({ missing: [] });
            const later = await askWiki("later", REPOS);
            expect(calls).toEqual([REPOS]);
            expect(later.repos).toEqual(REPOS);
        } finally {
            vi.useRealTimers();
        }
    });

    it("fails with a tool error when none of the repositories are indexed", async () => {
        fakeService({ missing: REPOS });
        await expect(askWiki("q", REPOS)).rejects.toBeInstanceOf(McpToolError);
    });

    it("does not fall back for network errors, so the caller can retry them", async () => {
        const { fetchMock } = fakeService({ failWith: new TypeError("fetch failed") });
        await expect(askWiki("q", REPOS)).rejects.toBeInstanceOf(TypeError);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("answers a repeated question from memory, ignoring case and spacing", async () => {
        const { calls } = fakeService({ missing: [] });
        await askWiki("How does X work?", REPOS);
        const again = await askWiki("  how does   X work? ", REPOS);
        expect(calls).toHaveLength(1);
        expect(again.repos).toEqual(REPOS);
        await askWiki("A different question", REPOS);
        expect(calls).toHaveLength(2);
    });

    it("reuses a fallback answer on the next request without any new calls", async () => {
        const { calls } = fakeService();
        await askWiki("same question", REPOS);
        calls.length = 0;
        const second = await askWiki("same question", REPOS);
        expect(calls).toHaveLength(0);
        expect(second.repos).toEqual(["o/Alpha", "o/Gamma"]);
    });

    it("stops reusing an answer after an hour", async () => {
        vi.useFakeTimers();
        try {
            const { calls } = fakeService({ missing: [] });
            await askWiki("q", REPOS);
            vi.advanceTimersByTime(60 * 60 * 1000 + 1);
            await askWiki("q", REPOS);
            expect(calls).toHaveLength(2);
        } finally {
            vi.useRealTimers();
        }
    });

    it("does not remember failures", async () => {
        fakeService({ failWith: new TypeError("fetch failed") });
        await expect(askWiki("q", REPOS)).rejects.toBeInstanceOf(TypeError);
        const { calls } = fakeService({ missing: [] });
        await askWiki("q", REPOS);
        expect(calls).toHaveLength(1);
    });

    it("throws when every repository is marked unavailable", async () => {
        fakeService({ missing: REPOS });
        await askWiki("q", REPOS).catch(() => {});
        await expect(askWiki("again", REPOS)).rejects.toThrow(/no repository is currently available/);
    });
});
