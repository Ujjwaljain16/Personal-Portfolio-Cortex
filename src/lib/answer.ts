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

/**
 * Whether the model started answering. It reads the stream only until the first
 * piece of text or an error; the same result can still be read in full afterwards.
 */
async function startsCleanly(result: ReturnType<typeof streamText>): Promise<boolean> {
    const reader = result.fullStream.getReader();
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) return true;
            if (value.type === "error") return false;
            if (value.type === "text-delta" || value.type === "finish") return true;
        }
    } catch {
        return false;
    } finally {
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
 * Streams an answer from the first model that starts responding. Gemini often
 * answers "high demand" (503) for a while, so a failed start moves on to the next
 * model instead of leaving the visitor waiting. If every model fails, the last
 * result is returned so the caller's own error handling can report it.
 */
export async function streamWithFallback(models: LanguageModel[], params: AnswerParams) {
    if (models.length === 0) throw new Error("no model configured");
    let last: ReturnType<typeof streamText> | undefined;
    for (const [index, model] of models.entries()) {
        const result = streamText({ ...params, model, maxRetries: 0 });
        last = result;
        if (await startsCleanly(result)) return result;
        console.error(`[ask] model ${index + 1} of ${models.length} did not start; ${index + 1 < models.length ? "trying the next" : "giving up"}`);
    }
    return last as ReturnType<typeof streamText>;
}
