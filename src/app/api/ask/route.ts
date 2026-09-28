import { google } from "@ai-sdk/google";
import { z } from "zod";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { askWiki } from "@/lib/wiki";
import { friendlyStreamError, streamWithFallback } from "@/lib/answer";
import { selectCorpus } from "@/lib/corpus";
import { buildWikiQuestion, pickRepos } from "@/lib/askRouting";
import { buildSystemPrompt, type NotesStatus } from "@/lib/askPrompt";

// Allow enough time for MCP retrieval + LLM streaming
export const maxDuration = 60;

// ─── Abuse limits (public, unauthenticated endpoint) ─────────────────────────
const MAX_BODY_BYTES = 32 * 1024; // whole request
const MAX_MESSAGES = 24; // client-side history length (12 exchanges)
const MAX_QUESTION_CHARS = 500; // one user turn
const HISTORY_USER_TURNS = 2; // only the latest user turns reach the model
const MAX_NOTES_CHARS = 12_000; // repository notes passed to the model
const NOTES_BUDGET_MS = 20_000; // past this, answer from the verified portfolio alone
const MAX_OUTPUT_TOKENS = 800;

// Repository lookups only ever touch these public repositories. A repository the
// lookup service has not indexed is skipped (see src/lib/wiki.ts), so listing one
// early is safe: it starts working as soon as it is indexed.
const WIKI_REPOS = [
    "Ujjwaljain16/RecoveryOS",
    "Ujjwaljain16/MiniDB",
    "Ujjwaljain16/VaultTabs",
    "Ujjwaljain16/CampusSync",
    "Ujjwaljain16/Fuze",
    "Ujjwaljain16/SpentSmart",
    "Ujjwaljain16/SSE-Observatory",
    "Ujjwaljain16/AgentBrake",
    "Ujjwaljain16/FlashFlow",
    "Ujjwaljain16/LEXIS",
];

// Tried in order. Gemini often answers "high demand" (503) on one model while another
// is fine, so a model that does not start responding is skipped. See src/lib/answer.ts.
const ANSWER_MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

// Per client IP and globally (per warm instance). See src/lib/rate-limit.ts.
const PER_CLIENT = { limit: 8, windowMs: 10 * 60 * 1000 };
const GLOBAL = { limit: 120, windowMs: 60 * 60 * 1000 };

// ─── HTTP helpers ────────────────────────────────────────────────────────────

type ErrorCode =
    | "rate_limited"
    | "payload_too_large"
    | "invalid_request"
    | "question_too_long"
    | "conversation_too_long"
    | "upstream_unavailable"
    | "server_error";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
    rate_limited: "You're asking a bit fast. Please wait a moment and try again.",
    payload_too_large: "That request is too large.",
    invalid_request: "That request couldn't be understood.",
    question_too_long: `Please keep your question under ${MAX_QUESTION_CHARS} characters.`,
    conversation_too_long: "This conversation has gotten long. Start a new conversation to continue.",
    upstream_unavailable: "The engineering record is temporarily unavailable. Please try again shortly.",
    server_error: "Something went wrong. Please try again.",
};

function errorResponse(status: number, code: ErrorCode, extraHeaders?: Record<string, string>) {
    return new Response(JSON.stringify({ code, error: ERROR_MESSAGES[code] }), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
    });
}

/** Reads the body but stops (and reports) as soon as it exceeds `max` bytes. */
async function readLimitedBody(req: Request, max: number): Promise<string | null> {
    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > max) return null;
    if (!req.body) return "";

    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let text = "";
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > max) {
            await reader.cancel();
            return null;
        }
        text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
}

function logError(scope: string, err: unknown) {
    // Name + short message only: never bodies, headers, or keys.
    const detail = err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 200) : "unknown error";
    console.error(`[ask] ${scope}: ${detail}`);
}

// ─── Request validation ──────────────────────────────────────────────────────

const bodySchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant", "system"]),
                parts: z
                    .array(z.object({ type: z.string(), text: z.string().optional() }))
                    .max(16)
                    .optional(),
            })
        )
        .min(1)
        .max(MAX_MESSAGES),
});

type Parsed =
    | { ok: true; questions: string[] }
    | { ok: false; code: ErrorCode; status: number };

/**
 * Only the user's own text is used. Assistant/system turns supplied by the
 * client are ignored entirely, so a caller cannot forge model context.
 */
function parseQuestions(raw: string): Parsed {
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return { ok: false, code: "invalid_request", status: 400 };
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
        const tooMany = parsed.error.issues.some((i) => i.code === "too_big" && i.path.join(".") === "messages");
        return tooMany
            ? { ok: false, code: "conversation_too_long", status: 400 }
            : { ok: false, code: "invalid_request", status: 400 };
    }

    const userTexts: string[] = [];
    for (const message of parsed.data.messages) {
        if (message.role !== "user") continue;
        const text = (message.parts ?? [])
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text as string)
            .join("")
            .trim();
        if (text.length > MAX_QUESTION_CHARS) return { ok: false, code: "question_too_long", status: 400 };
        if (text) userTexts.push(text);
    }

    if (userTexts.length === 0) return { ok: false, code: "invalid_request", status: 400 };
    return { ok: true, questions: userTexts.slice(-HISTORY_USER_TURNS) };
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        // 1. Cheap rejections first: rate limit, then size, then shape.
        const limited = checkRateLimit(getClientId(req), PER_CLIENT, GLOBAL);
        if (!limited.ok) {
            return errorResponse(429, "rate_limited", { "Retry-After": String(limited.retryAfter) });
        }

        const raw = await readLimitedBody(req, MAX_BODY_BYTES);
        if (raw === null) return errorResponse(413, "payload_too_large");

        const parsed = parseQuestions(raw);
        if (!parsed.ok) return errorResponse(parsed.status, parsed.code);

        const question = parsed.questions[parsed.questions.length - 1];
        const previous = parsed.questions.length > 1 ? parsed.questions[0] : null;
        const userContent = previous
            ? `Earlier question: ${previous}\n\nCurrent question: ${question}`
            : question;

        // 2. Repository notes: reword the question for the one or two repositories it names and
        //    ask the lookup service. This is optional detail, so any failure just skips it.
        const picked = pickRepos(question, previous, WIKI_REPOS);
        let notes: NotesStatus = { kind: "none" };
        if (picked.repos.length > 0) {
            try {
                const answer = await askWiki(buildWikiQuestion(question, picked), picked.repos, { budgetMs: NOTES_BUDGET_MS });
                notes = answer.text.trim()
                    ? { kind: "used", repos: answer.repos, text: answer.text.slice(0, MAX_NOTES_CHARS) }
                    : { kind: "unavailable" };
            } catch (err) {
                logError("repository notes", err);
                notes = { kind: "unavailable" };
            }
        }

        // 3. Answer from the verified portfolio, with the notes as unchecked extra detail
        const system = buildSystemPrompt(selectCorpus(question, previous).text, notes);

        const result = await streamWithFallback(
            ANSWER_MODELS.map((id) => google(id)),
            {
                system,
                messages: [{ role: "user", content: userContent }],
                temperature: 0.3,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                abortSignal: req.signal,
                onError: ({ error }) => logError("stream", error),
            }
        );

        return result.toUIMessageStreamResponse({
            onError: (error) => friendlyStreamError(error),
        });
    } catch (err) {
        logError("handler", err);
        return errorResponse(500, "server_error");
    }
}
