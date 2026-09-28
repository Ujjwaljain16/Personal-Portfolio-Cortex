import "server-only";

/**
 * Retrieval over the public repositories through the Devin MCP `ask_wiki_question`
 * tool (DeepWiki). If the service does not know one of the repositories (it has to
 * be added on the service side first), that repository is skipped instead of
 * failing the whole question, and remembered as unavailable for a while so the next
 * requests do not pay for a second call.
 */

const RETRIEVAL_TIMEOUT_MS = 30_000; // one call; answers usually take 15-30s
const TOTAL_BUDGET_MS = 45_000; // everything askWiki does, including the fallback round
const UNAVAILABLE_TTL_MS = 60 * 60 * 1000; // how long a not-indexed repository is left out
const ANSWER_TTL_MS = 60 * 60 * 1000; // how long a retrieved answer is reused
const MAX_CACHED_ANSWERS = 100;

/** A tool-level failure reported by the service (as opposed to a network or HTTP failure). */
export class McpToolError extends Error {
    /** The service's own message. Server-side only: never returned to a visitor. */
    readonly detail: string;
    readonly repoNotFound: boolean;

    constructor(tool: string, detail: string) {
        super(`MCP ${tool} reported a tool error`);
        this.name = "McpToolError";
        this.detail = detail.slice(0, 300);
        this.repoNotFound = /repository not found/i.test(detail);
    }
}

// repo -> time until which it is treated as not indexed
const unavailable = new Map<string, number>();

// Retrieval is the slow part (15-30s), so a question asked again is answered from here.
const answers = new Map<string, { answer: WikiAnswer; expires: number }>();

const cacheKey = (repos: string[], question: string) => `${repos.join(",")}|${question.trim().toLowerCase().replace(/\s+/g, " ")}`;

/** Test helper. */
export function resetWikiState() {
    unavailable.clear();
    answers.clear();
}

export interface WikiAnswer {
    text: string;
    /** The repositories the answer was drawn from. */
    repos: string[];
}

/**
 * Calls one MCP tool over Streamable HTTP and returns its text content.
 * The endpoint requires `Accept: application/json, text/event-stream` and
 * replies with SSE (`event: message` / `data: {json-rpc}`), so both forms are
 * handled. Tool-level failures arrive as `result.isError` and are thrown.
 */
async function callDevinMCP(toolName: string, args: Record<string, unknown>, timeoutMs: number): Promise<string> {
    const apiKey = process.env.DEVIN_API_KEY;
    if (!apiKey) throw new Error("DEVIN_API_KEY is not configured");

    const res = await fetch("https://mcp.devin.ai/mcp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "tools/call",
            params: { name: toolName, arguments: args },
        }),
        signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) throw new Error(`MCP ${toolName} returned status ${res.status}`);

    const body = await res.text();
    const payloads = (res.headers.get("content-type") ?? "").includes("text/event-stream")
        ? body
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim())
        : [body];

    for (const payload of payloads) {
        let message: {
            error?: unknown;
            result?: { isError?: boolean; content?: Array<{ type: string; text?: string }> };
        };
        try {
            message = JSON.parse(payload);
        } catch {
            continue;
        }
        if (message.error) throw new Error(`MCP ${toolName} returned a JSON-RPC error`);
        if (message.result) {
            const text = (message.result.content ?? [])
                .filter((c) => c.type === "text" && typeof c.text === "string")
                .map((c) => c.text)
                .join("\n");
            if (message.result.isError) throw new McpToolError(toolName, text);
            return text;
        }
    }
    throw new Error(`MCP ${toolName} returned no result`);
}

/** One call, limited by both the per-call timeout and what is left of the overall budget. */
const askOnce = (repos: string[], question: string, deadline: number) => {
    const left = deadline - Date.now();
    if (left < 2000) throw new Error("retrieval time budget used up");
    return callDevinMCP("ask_wiki_question", { repoName: repos, question }, Math.min(RETRIEVAL_TIMEOUT_MS, left));
};

export async function askWiki(question: string, repos: string[]): Promise<WikiAnswer> {
    const now = Date.now();
    const active = repos.filter((r) => (unavailable.get(r) ?? 0) <= now);
    if (active.length === 0) throw new Error("no repository is currently available");

    const key = cacheKey(active, question);
    const cached = answers.get(key);
    if (cached && cached.expires > now) return cached.answer;

    const deadline = now + TOTAL_BUDGET_MS;
    // Stored under the repositories that actually answered, because that is the set later requests will use.
    const remember = (answer: WikiAnswer) => {
        if (answers.size >= MAX_CACHED_ANSWERS) answers.delete(answers.keys().next().value as string);
        answers.set(cacheKey(answer.repos, question), { answer, expires: Date.now() + ANSWER_TTL_MS });
        return answer;
    };

    try {
        return remember({ text: await askOnce(active, question, deadline), repos: active });
    } catch (err) {
        // Only "repository not found" is recoverable here; network and HTTP errors
        // propagate so the caller can retry or report them.
        if (!(err instanceof McpToolError && err.repoNotFound)) throw err;
    }

    // The service names every requested repository in that error, not just the missing ones,
    // so ask each one on its own to find out which are usable.
    const settled = await Promise.allSettled(active.map((repo) => Promise.resolve().then(() => askOnce([repo], question, deadline))));
    const found: { repo: string; text: string }[] = [];
    let failure: unknown;
    settled.forEach((result, i) => {
        const repo = active[i];
        if (result.status === "fulfilled") {
            found.push({ repo, text: result.value });
            return;
        }
        failure = result.reason;
        if (result.reason instanceof McpToolError && result.reason.repoNotFound) {
            unavailable.set(repo, now + UNAVAILABLE_TTL_MS);
            console.error(`[ask] repository is not indexed by the retrieval service, skipping: ${repo}`);
        }
    });

    if (found.length === 0) throw failure ?? new Error("no repository answered");
    const text = found.length === 1 ? found[0].text : found.map((a) => `### ${a.repo}\n${a.text}`).join("\n\n");
    return remember({ text, repos: found.map((a) => a.repo) });
}
