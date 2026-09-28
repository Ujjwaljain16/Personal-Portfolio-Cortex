"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";
import { SendHorizonal, Loader2, User, Cpu, RotateCcw, AlertTriangle } from "lucide-react";

const MAX_QUESTION_CHARS = 500; // keep in sync with src/app/api/ask/route.ts

// ─── Suggested starter prompts ────────────────────────
// Keep these answerable from the indexed repos (CampusSync, Fuze, SpentSmart, SSE-Observatory).
const STARTERS = [
    "How do you approach scaling a recommendation engine?",
    "What tradeoffs did you make with Row-Level Security?",
    "Why did SpentSmart avoid SMS parsing to detect payments?",
    "How does SSE-Observatory stay smooth with thousands of events?",
];

const transport = new DefaultChatTransport({ api: "/api/ask" });

/** The API returns `{ code, error }` JSON on failure; the transport surfaces it as the Error message. */
function parseAskError(error: Error): { code: string; message: string } {
    try {
        const body = JSON.parse(error.message) as { code?: string; error?: string };
        if (body.error) return { code: body.code ?? "unknown", message: body.error };
    } catch {
        /* not JSON: fall through */
    }
    return { code: "unknown", message: "Something went wrong. Please try again." };
}

export function AskInterface() {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState("");
    const inputId = useId();
    const hintId = useId();

    const { messages, sendMessage, status, error, regenerate, clearError, setMessages } = useChat({ transport });

    const isProcessing = status === "submitted" || status === "streaming";
    const askError = error ? parseAskError(error) : null;
    const conversationTooLong = askError?.code === "conversation_too_long";

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, status]);

    const handleSubmit = useCallback(
        (e?: React.FormEvent) => {
            e?.preventDefault();
            const text = input.trim();
            if (!text || isProcessing) return;
            sendMessage({ text });
            setInput("");
        },
        [input, isProcessing, sendMessage]
    );

    // Submit on Enter (Shift+Enter for newline)
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit]
    );

    const handleStarter = useCallback((prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    }, []);

    const handleNewConversation = useCallback(() => {
        setMessages([]);
        clearError();
        setInput("");
        inputRef.current?.focus();
    }, [setMessages, clearError]);

    const getMessageText = useCallback(
        (msg: (typeof messages)[number]): string =>
            msg.parts
                .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                .map((p) => p.text)
                .join(""),
        []
    );

    return (
        <div className="max-w-180 mx-auto flex flex-col h-full min-h-0">
            {/* Messages area */}
            <div
                role="log"
                aria-label="Conversation"
                aria-busy={isProcessing}
                className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pb-4"
            >
                {messages.length === 0 ? (
                    <EmptyState onSelect={handleStarter} />
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                        >
                            {msg.role === "assistant" && (
                                <div
                                    className="w-7 h-7 rounded-lg bg-(--accent-primary)/10 flex items-center justify-center shrink-0 mt-0.5"
                                    aria-hidden="true"
                                >
                                    <Cpu className="w-3.5 h-3.5 text-(--accent-primary)" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-xl px-4 py-3 text-[14px] leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-(--accent-primary)/10 text-foreground"
                                        : "bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default)"
                                )}
                            >
                                <span className="sr-only">{msg.role === "user" ? "You: " : "Ujjwal: "}</span>
                                <Markdown variant="chat">{getMessageText(msg)}</Markdown>
                            </div>
                            {msg.role === "user" && (
                                <div
                                    className="w-7 h-7 rounded-lg bg-(--bg-surface-2) flex items-center justify-center shrink-0 mt-0.5"
                                    aria-hidden="true"
                                >
                                    <User className="w-3.5 h-3.5 text-(--text-muted)" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {status === "submitted" && (
                    <div role="status" className="flex items-center gap-2 text-(--text-secondary) text-[13px] font-mono pl-10">
                        <Loader2 className="w-3 h-3 motion-safe:animate-spin" aria-hidden="true" />
                        <span>Searching the engineering record…</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error state */}
            {askError && (
                <div
                    role="alert"
                    className="shrink-0 mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-(--danger)/40 bg-(--danger)/10 px-4 py-3 text-[13px] text-foreground"
                >
                    <AlertTriangle className="w-4 h-4 text-(--danger) shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-48">{askError.message}</span>
                    {!conversationTooLong && (
                        <button
                            type="button"
                            onClick={() => regenerate()}
                            className="inline-flex items-center gap-1.5 rounded-md border border-(--border-hover) px-3 py-1.5 font-mono text-[12px] hover:border-(--accent-primary) hover:text-(--accent-primary)"
                        >
                            <RotateCcw className="w-3 h-3" aria-hidden="true" />
                            Retry
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleNewConversation}
                        className="rounded-md border border-(--border-hover) px-3 py-1.5 font-mono text-[12px] hover:border-(--accent-primary) hover:text-(--accent-primary)"
                    >
                        New conversation
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="shrink-0 pt-3 border-t border-(--border-default)">
                <form onSubmit={handleSubmit} className="relative">
                    <label htmlFor={inputId} className="sr-only">
                        Ask a question about Ujjwal&apos;s engineering work
                    </label>
                    <textarea
                        id={inputId}
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask how I think…"
                        rows={2}
                        maxLength={MAX_QUESTION_CHARS}
                        aria-describedby={hintId}
                        disabled={isProcessing}
                        className={cn(
                            "w-full resize-none rounded-xl border border-(--border-default) bg-(--bg-surface-1) px-4 py-3 pr-14",
                            "text-[14px] text-foreground placeholder:text-(--text-muted)",
                            "focus-visible:outline-2 focus-visible:outline-(--accent-primary) focus-visible:border-(--accent-primary) transition-colors",
                            "font-mono disabled:opacity-60"
                        )}
                    />
                    <button
                        type="submit"
                        aria-label="Send question"
                        disabled={isProcessing || !input.trim()}
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-colors",
                            input.trim() && !isProcessing
                                ? "text-(--accent-primary) hover:bg-(--accent-primary)/10"
                                : "text-(--text-muted) cursor-not-allowed"
                        )}
                    >
                        <SendHorizonal className="w-4 h-4" aria-hidden="true" />
                    </button>
                </form>
                <div className="flex items-center justify-between mt-2 px-1 gap-3">
                    <span id={hintId} className="text-[12px] text-(--text-muted) font-mono">
                        Enter to send · Shift+Enter for newline · {input.length}/{MAX_QUESTION_CHARS}
                    </span>
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleNewConversation}
                            className="text-[12px] text-(--text-secondary) font-mono hover:text-(--accent-primary) underline underline-offset-2"
                        >
                            New conversation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Empty state with starter prompts ──────────────────
function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
    return (
        <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="p-3 rounded-xl bg-(--accent-primary)/10 mb-4" aria-hidden="true">
                <Cpu className="w-6 h-6 text-(--accent-primary)" />
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Ask how I think</h2>
            <p className="text-[14px] text-(--text-secondary) text-center mb-8 max-w-sm">
                Ask about the design decisions and trade-offs in CampusSync, Fuze, SpentSmart and SSE-Observatory.
                Answers are grounded in those repositories, and the assistant says so when it has no data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {STARTERS.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => onSelect(prompt)}
                        className={cn(
                            "text-left px-4 py-3 rounded-xl border border-(--border-default)",
                            "text-[13px] text-(--text-secondary) leading-relaxed",
                            "hover:border-(--border-hover) hover:text-foreground transition-colors",
                            "bg-(--bg-surface-1)"
                        )}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
