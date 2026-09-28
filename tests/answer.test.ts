import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APICallError, simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { friendlyStreamError, streamWithFallback } from "@/lib/answer";

const usage = {
    inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 2, text: 2, reasoning: 0 },
};

/** A model that answers with the given text. */
const answering = (text: string) =>
    new MockLanguageModelV3({
        doStream: async () => ({
            stream: simulateReadableStream({
                chunks: [
                    { type: "text-start", id: "t" },
                    { type: "text-delta", id: "t", delta: text },
                    { type: "text-end", id: "t" },
                    { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage },
                ],
            }),
        }),
    });

/** A model that fails the way an overloaded Gemini does. */
const overloaded = () =>
    new MockLanguageModelV3({
        doStream: async () => {
            throw new Error("This model is currently experiencing high demand.");
        },
    });

const params = { system: "s", messages: [{ role: "user" as const, content: "hi" }] };

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("streamWithFallback", () => {
    it("uses the first model when it answers, and never touches the others", async () => {
        const first = answering("from first");
        const second = answering("from second");
        const result = await streamWithFallback([first, second], params);
        expect(await result.text).toBe("from first");
        expect(first.doStreamCalls).toHaveLength(1);
        expect(second.doStreamCalls).toHaveLength(0);
    });

    it("moves to the next model when the first is overloaded", async () => {
        const first = overloaded();
        const second = answering("from second");
        const result = await streamWithFallback([first, second], params);
        expect(await result.text).toBe("from second");
        expect(first.doStreamCalls).toHaveLength(1);
        expect(second.doStreamCalls).toHaveLength(1);
    });

    it("skips several failing models in a row", async () => {
        const result = await streamWithFallback([overloaded(), overloaded(), answering("third")], params);
        expect(await result.text).toBe("third");
    });

    it("streams the whole answer to the visitor after checking the start", async () => {
        const result = await streamWithFallback([overloaded(), answering("hello there")], params);
        const body = await result.toUIMessageStreamResponse().text();
        expect(body).toContain("hello there");
    });

    it("does not retry a model that failed to start", async () => {
        const first = overloaded();
        await streamWithFallback([first, answering("ok")], params);
        expect(first.doStreamCalls).toHaveLength(1);
    });

    it("hands back the last result when every model fails, so the caller can report it", async () => {
        const errors: unknown[] = [];
        const result = await streamWithFallback([overloaded(), overloaded()], { ...params, onError: ({ error }) => errors.push(error) });
        await result.toUIMessageStreamResponse({ onError: () => "interrupted" }).text();
        expect(errors.length).toBeGreaterThan(0);
    });

    it("refuses an empty model list", async () => {
        await expect(streamWithFallback([], params)).rejects.toThrow(/no model/);
    });
});

describe("friendlyStreamError", () => {
    const apiError = (message: string, responseBody: string, statusCode: number) =>
        new APICallError({ message, url: "https://example.test", requestBodyValues: {}, statusCode, responseBody });

    it("says plainly when the daily cap is what stopped the answer", () => {
        const body = JSON.stringify({ error: { details: [{ violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }] }] } });
        expect(friendlyStreamError(apiError("You exceeded your current quota", body, 429))).toMatch(/daily limit/);
    });

    it("tells a per-minute limit apart from the daily cap", () => {
        const body = JSON.stringify({ error: { details: [{ violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }] }] } });
        const message = friendlyStreamError(apiError("You exceeded your current quota", body, 429));
        expect(message).toMatch(/usage limit/);
        expect(message).not.toMatch(/daily/);
    });

    it("says the service is busy for a high-demand error", () => {
        expect(friendlyStreamError(apiError("This model is currently experiencing high demand.", "{}", 503))).toMatch(/busy/);
    });

    it("never repeats provider text, and has a plain fallback", () => {
        const message = friendlyStreamError(new Error("secret internal detail xyz"));
        expect(message).not.toContain("secret internal detail");
        expect(message).toMatch(/interrupted/);
    });
});
