import "server-only";

/**
 * Retrieval over the public repositories through the Devin MCP `ask_wiki_question`
 * tool (DeepWiki). If the service does not know one of the repositories (it has to
 * be added on the service side first), that repository is skipped instead of
 * failing the whole question, and remembered as unavailable for a while so the next
 * requests do not pay for a second call.
 */

const RETRIEVAL_TIMEOUT_MS = 30_000; // answers take ~10-15s
const UNAVAILABLE_TTL_MS = 10 * 60 * 1000;

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

/** Test helper. */
export function resetWikiState() {
    unavailable.clear();
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
async function callDevinMCP(toolName: string, args: Record<string, unknown>): Promise<string> {
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
        signal: AbortSignal.timeout(RETRIEVAL_TIMEOUT_MS),
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

const askOnce = (repos: string[], question: string) =>
    callDevinMCP("ask_wiki_question", { repoName: repos, question });

export async function askWiki(question: string, repos: string[]): Promise<WikiAnswer> {
    const now = Date.now();
    const active = repos.filter((r) => (unavailable.get(r) ?? 0) <= now);
    if (active.length === 0) throw new Error("no repository is currently available");

    try {
        return { text: await askOnce(active, question), repos: active };
    } catch (err) {
        // Only "repository not found" is recoverable here; network and HTTP errors
        // propagate so the caller can retry or report them.
        if (!(err instanceof McpToolError && err.repoNotFound)) throw err;
    }

    // The service names every requested repository in that error, not just the missing ones,
    // so ask each one on its own to find out which are usable.
    const settled = await Promise.allSettled(active.map((repo) => askOnce([repo], question)));
    const answers: { repo: string; text: string }[] = [];
    let failure: unknown;
    settled.forEach((result, i) => {
        const repo = active[i];
        if (result.status === "fulfilled") {
            answers.push({ repo, text: result.value });
            return;
        }
        failure = result.reason;
        if (result.reason instanceof McpToolError && result.reason.repoNotFound) {
            unavailable.set(repo, now + UNAVAILABLE_TTL_MS);
            console.error(`[ask] repository is not indexed by the retrieval service, skipping: ${repo}`);
        }
    });

    if (answers.length === 0) throw failure ?? new Error("no repository answered");
    const text = answers.length === 1 ? answers[0].text : answers.map((a) => `### ${a.repo}\n${a.text}`).join("\n\n");
    return { text, repos: answers.map((a) => a.repo) };
}
