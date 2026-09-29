import "server-only";
import { APICallError, streamText, type LanguageModel, type ModelMessage } from "ai";

interface AnswerParams {
    system: string;
    messages: ModelMessage[];
    temperature?: number;
    maxOutputTokens?: number;
    abortSignal?: AbortSignal;
    onError?: (event: { error: unknown }) => void;
}

/** Total time budget, across every model tried, for the first one to prove it has started. */
export const DEFAULT_TOTAL_PEEK_BUDGET_MS = 20_000;
/** No single model may hold up the fallback loop for more than this, even if budget remains. */
const MAX_PEEK_PER_MODEL_MS = 10_000;

/**
 * Whether the model started answering within `timeoutMs`. Reads the stream only until the
 * first piece of text, an error, or the timeout; the same result can still be read in full
 * afterwards (see src/lib/corpus.ts's teeStream note: the SDK tees fullStream on each access,
 * so an earlier peek does not consume what a later full read needs).
 *
 * A hung provider (no data, no error) is exactly the failure this budget exists for: without
 * it, a single stuck model can sit here for the rest of the request's execution time, and the
 * function is then killed mid-answer with only a partial response delivered to the visitor.
 */
async function startsCleanly(result: ReturnType<typeof streamText>, timeoutMs: number): Promise<boolean> {
    const reader = result.fullStream.getReader();
    const timedOut: unique symbol = Symbol("timed out");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<typeof timedOut>((resolve) => {
        timer = setTimeout(() => resolve(timedOut), timeoutMs);
    });
    try {
        for (;;) {
            const outcome = await Promise.race([reader.read(), timeout]);
            if (outcome === timedOut) return false;
            if (outcome.done) return true;
            if (outcome.value.type === "error") return false;
            if (outcome.value.type === "text-delta" || outcome.value.type === "finish") return true;
        }
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
        await reader.cancel().catch(() => {});
    }
}

/**
 * What a visitor is told when no model could answer: honest about the cause, without provider
 * details. A daily cap (which no retry will fix) is told apart from a busy moment.
 */
export function friendlyStreamError(error: unknown): string {
    const body = APICallError.isInstance(error) ? (error.responseBody ?? "") : "";
    const text = `${error instanceof Error ? error.message : ""} ${body}`.toLowerCase();
    if (body.includes("PerDay") || text.includes("daily")) {
        return "The AI assistant has reached its daily limit and will work again tomorrow. Everything it draws on is still on the Projects, Decisions and Investigations pages.";
    }
    if (text.includes("quota") || text.includes("rate limit") || text.includes("429")) {
        return "The AI assistant is at its usage limit for a moment. Please try again in a minute.";
    }
    if (text.includes("high demand") || text.includes("overloaded") || text.includes("unavailable") || text.includes("503")) {
        return "The AI service is busy right now. Please try again in a moment.";
    }
    return "The response was interrupted. Please try again.";
}

/**
 * Streams an answer from the first model that starts responding. Gemini often answers
 * "high demand" (503) for a while, or simply hangs, so a model that does not visibly start
 * within its slice of `totalPeekBudgetMs` is abandoned for the next one. This budget is what
 * keeps a slow or stuck model from eating the request's whole execution time and leaving the
 * function killed mid-answer; the actual generation, once a model has started, is not subject
 * to it. If every model fails, the last result is returned so the caller's own error handling
 * can report it.
 */
export async function streamWithFallback(models: LanguageModel[], params: AnswerParams, options: { totalPeekBudgetMs?: number } = {}) {
    if (models.length === 0) throw new Error("no model configured");
    const deadline = Date.now() + (options.totalPeekBudgetMs ?? DEFAULT_TOTAL_PEEK_BUDGET_MS);
    let last: ReturnType<typeof streamText> | undefined;
    for (const [index, model] of models.entries()) {
        const remainingModels = models.length - index;
        const share = Math.max(1000, Math.floor((deadline - Date.now()) / remainingModels));
        const timeoutMs = Math.min(share, MAX_PEEK_PER_MODEL_MS);
        const result = streamText({ ...params, model, maxRetries: 0 });
        last = result;
        if (await startsCleanly(result, timeoutMs)) return result;
        console.error(`[ask] model ${index + 1} of ${models.length} did not start within ${timeoutMs}ms; ${index + 1 < models.length ? "trying the next" : "giving up"}`);
    }
    return last as ReturnType<typeof streamText>;
}
