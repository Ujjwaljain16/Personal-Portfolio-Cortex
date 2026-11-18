"use client";

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";
import { ArrowUp, Loader2, RotateCcw, AlertTriangle } from "lucide-react";

const MAX_QUESTION_CHARS = 500; // keep in sync with src/app/api/ask/route.ts
const GIVE_UP_AFTER_SECONDS = 75; // the server stops trying well before this

// ─── Suggested questions, by what a visitor might want ─────
// Each set shows a different side of the assistant: the record itself, reasoning about problems I have not solved
// (which it must label as such), hiring questions answered from evidence, and interview practice.
const MODES = [
    {
        id: "work",
        label: "My work",
        questions: [
            "Why isn't the LLM in RecoveryOS allowed to move money?",
            "Was MiniDB's vectorized executor as fast as planned?",
            "What did you get wrong in AgentBrake, and how did you fix it?",
            "How did CampusSync's credential lookup get from 1,172 ms to 0.2 ms?",
        ],
    },
    {
        id: "build",
        label: "How I'd build it",
        questions: [
            "How would you design a job queue that never charges a payment twice?",
            "Production starts returning intermittent 500s. What do you do first?",
            "How would you approach a large codebase you've never seen?",
            "How would you make a cache survive one of its nodes going down?",
        ],
    },
    {
        id: "hiring",
        label: "Hiring",
        questions: [
            "Would you be a good fit for a backend engineering internship?",
            "What's your strongest evidence that you understand distributed systems?",
            "What are your weaknesses, with evidence?",
            "How do you compare with someone who has two years of industry experience?",
        ],
    },
    {
        id: "interview",
        label: "Interview me",
        questions: [
            "Ask me three backend questions based on your projects, then answer them.",
            "Tell me about a bug where your first diagnosis was wrong.",
            "Which decision would you make differently now, and why?",
            "What's the hardest failure you've debugged?",
        ],
    },
] as const;

const transport = new DefaultChatTransport({ api: "/api/ask" });

/**
 * The model sometimes cites a page the way the portfolio text it reads does, as a bare path in brackets
 * ("[/investigations#some-id]"), which would show as raw text. A bare path that is a real page becomes a small
 * "source" link; anything else is left alone (and the Markdown renderer still refuses unknown targets).
 */
export function linkBarePaths(text: string, allowed: Set<string>): string {
    return text.replace(/\[(\/[^\]\s()]*)\](?!\()/g, (match, path: string) => (allowed.has(path) ? `[source](${path})` : match));
}

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

/** Counts seconds while a question is in flight and says what is going on, so a slow answer never looks like a hang. */
function WaitingNotice({ onGiveUp }: { onGiveUp: () => void }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (seconds >= GIVE_UP_AFTER_SECONDS) onGiveUp();
    }, [seconds, onGiveUp]);

    // The wording changes only at thresholds, so a screen reader is not read a new sentence every second.
    const message =
        seconds < 8
            ? "Searching the engineering record…"
            : seconds < 40
              ? "Still searching. Answers usually take 15 to 30 seconds."
              : "Taking longer than usual. You can keep waiting.";

    return (
        <div role="status" className="flex items-center gap-2 text-(--text-secondary) text-[13px] font-mono">
            <Loader2 className="w-3 h-3 motion-safe:animate-spin" aria-hidden="true" />
            <span>{message}</span>
            <span aria-hidden="true" className="text-(--text-muted)">
                {seconds}s
            </span>
        </div>
    );
}

export function AskInterface({ allowedLinks }: { allowedLinks: string[] }) {
    const linkSet = useMemo(() => new Set(allowedLinks), [allowedLinks]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState("");
    const inputId = useId();
    const hintId = useId();

    const { messages, sendMessage, status, error, regenerate, clearError, setMessages, stop } = useChat({ transport });
    const [timedOut, setTimedOut] = useState(false);

    const isProcessing = status === "submitted" || status === "streaming";
    const askError = error
        ? parseAskError(error)
        : timedOut
          ? { code: "timeout", message: "That took too long. Please try again." }
          : null;
    const conversationTooLong = askError?.code === "conversation_too_long";

    // Auto-scroll to latest message
    useEffect(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        messagesEndRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
    }, [messages, status]);

    const handleSubmit = useCallback(
        (e?: React.FormEvent) => {
            e?.preventDefault();
            const text = input.trim();
            if (!text || isProcessing) return;
            setTimedOut(false);
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
        setTimedOut(false);
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
        <div className="max-w-[46rem] flex flex-col h-full min-h-0">
            {/* Messages area */}
            <div
                role="log"
                aria-label="Conversation"
                aria-busy={isProcessing}
                className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-8 pb-6"
            >
                {messages.length === 0 ? (
                    <EmptyState onSelect={handleStarter} />
                ) : (
                    messages.map((msg) =>
                        msg.role === "user" ? (
                            <div key={msg.id} className="flex justify-end">
                                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-(--border-default) bg-(--bg-surface-1) px-4 py-3 text-[15px] leading-relaxed text-foreground">
                                    <span className="sr-only">You: </span>
                                    {getMessageText(msg)}
                                </div>
                            </div>
                        ) : (
                            <div key={msg.id}>
                                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-(--text-muted)" aria-hidden="true">
                                    Digital Ujjwal
                                </p>
                                <span className="sr-only">Digital Ujjwal: </span>
                                <div className="text-[15.5px] leading-[1.7] text-(--text-secondary)">
                                    <Markdown variant="chat" allowedLinks={linkSet}>
                                        {linkBarePaths(getMessageText(msg), linkSet)}
                                    </Markdown>
                                </div>
                            </div>
                        ),
                    )
                )}

                {status === "submitted" && (
                    <WaitingNotice
                        onGiveUp={() => {
                            stop();
                            setTimedOut(true);
                        }}
                    />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error state */}
            {askError && (
                <div
                    role="alert"
                    className="shrink-0 mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-(--danger)/30 bg-(--danger)/5 px-4 py-3 text-[13.5px] text-foreground"
                >
                    <AlertTriangle className="w-4 h-4 text-(--danger) shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-48">{askError.message}</span>
                    {!conversationTooLong && (
                        <button
                            type="button"
                            onClick={() => {
                                setTimedOut(false);
                                regenerate();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-(--border-hover) px-3 py-1.5 font-mono text-[12px] hover:border-(--text-muted) transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" aria-hidden="true" />
                            Retry
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleNewConversation}
                        className="rounded-full border border-(--border-hover) px-3 py-1.5 font-mono text-[12px] hover:border-(--text-muted) transition-colors"
                    >
                        New conversation
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="shrink-0 pt-4">
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
                        placeholder="Ask me about my work, or how I'd approach a problem…"
                        rows={2}
                        maxLength={MAX_QUESTION_CHARS}
                        aria-describedby={hintId}
                        disabled={isProcessing}
                        className={cn(
                            "w-full resize-none rounded-2xl border border-(--border-default) bg-(--bg-surface-1) px-5 py-4 pr-16",
                            "text-[15px] leading-relaxed text-foreground placeholder:text-(--text-muted)",
                            "focus-visible:outline-none focus-visible:border-(--border-hover) focus-visible:shadow-[0_0_0_4px_rgba(var(--glow-primary-rgb),0.12)] transition-[border-color,box-shadow]",
                            "disabled:opacity-60"
                        )}
                    />
                    <button
                        type="submit"
                        aria-label="Send question"
                        disabled={isProcessing || !input.trim()}
                        className={cn(
                            "absolute right-3 bottom-3.5 grid h-9 w-9 place-items-center rounded-full transition-colors",
                            input.trim() && !isProcessing
                                ? "bg-(--text-primary) text-(--bg-primary) hover:opacity-90"
                                : "bg-(--bg-surface-2) text-(--text-muted) cursor-not-allowed"
                        )}
                    >
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
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
                            className="text-[12px] text-(--text-secondary) font-mono hover:text-foreground underline decoration-(--border-hover) underline-offset-4"
                        >
                            New conversation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Empty state: question modes ────────────────────────
// The page header already says what this is, so the empty state is just the invitation: a few kinds of question,
// each with examples that work against the record.
function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
    const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("work");
    const current = MODES.find((m) => m.id === mode) ?? MODES[0];

    return (
        // min-h-full + mt-auto, not h-full + justify-end: with justify-end, questions taller than the space (a phone)
        // would overflow upward under the header instead of scrolling.
        <div className="flex min-h-full flex-col pb-2">
            <div className="mt-auto mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Kinds of question">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={m.id === mode}
                        onClick={() => setMode(m.id)}
                        className={cn(
                            "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] transition-colors",
                            m.id === mode
                                ? "border-(--text-primary) bg-(--text-primary) text-(--bg-primary)"
                                : "border-(--border-default) text-(--text-secondary) hover:border-(--border-hover) hover:text-foreground",
                        )}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
            <div role="tabpanel" aria-label={current.label} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {current.questions.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => onSelect(prompt)}
                        className={cn(
                            "group flex items-start justify-between gap-3 rounded-2xl border border-(--border-default) bg-(--bg-surface-1) px-4 py-3.5 text-left",
                            "text-[14px] leading-relaxed text-(--text-secondary) transition-colors hover:border-(--border-hover) hover:text-foreground",
                        )}
                    >
                        {prompt}
                        <ArrowUp className="mt-1 h-3.5 w-3.5 shrink-0 rotate-45 text-(--text-muted) transition-colors group-hover:text-foreground" aria-hidden="true" />
                    </button>
                ))}
            </div>
            {mode === "build" && (
                <p className="mt-4 text-[13px] text-(--text-muted)">
                    These are problems I may not have solved. The answer says when it is reasoning rather than describing something I built.
                </p>
            )}
        </div>
    );
}
