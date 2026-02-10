"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/lib/store";
import { SendHorizonal, Loader2, User, Cpu } from "lucide-react";

// ─── Suggested starter prompts ────────────────────────
const STARTERS = [
    "How do you approach scaling a recommendation engine?",
    "What tradeoffs did you make with Row-Level Security?",
    "How does AgentBrake prevent rogue AI tool calls?",
    "Walk me through a deployment that was rolled back.",
];

const transport = new DefaultChatTransport({ api: "/api/ask" });

export function AskInterface() {
    const setContextContent = useSystemStore((s) => s.setContextContent);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState("");

    const { messages, sendMessage, status } = useChat({ transport });

    const isProcessing = status === "submitted" || status === "streaming";

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Update context panel with last assistant message
    useEffect(() => {
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant) {
            // Extract text from parts
            const text = lastAssistant.parts
                .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                .map((p) => p.text)
                .join("");

            if (text) {
                setContextContent({
                    type: "markdown",
                    content: `## Query Response\n\n${text.slice(0, 600)}${text.length > 600 ? "\n\n*…continued in main panel*" : ""}`,
                });
            }
        }
    }, [messages, setContextContent]);

    // Submit handler
    const handleSubmit = useCallback(
        (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!input.trim() || isProcessing) return;
            sendMessage({ text: input });
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

    // Click a starter prompt
    const handleStarter = useCallback(
        (prompt: string) => {
            setInput(prompt);
            inputRef.current?.focus();
        },
        []
    );

    // Extract text content from a message
    const getMessageText = useCallback(
        (msg: (typeof messages)[number]): string => {
            return msg.parts
                .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                .map((p) => p.text)
                .join("");
        },
        []
    );

    return (
        <div className="max-w-180 mx-auto flex flex-col h-[calc(100vh-140px)]">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-4">
                {messages.length === 0 ? (
                    <EmptyState onSelect={handleStarter} />
                ) : (
                    messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "flex gap-3",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-7 h-7 rounded-lg bg-(--accent-primary)/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Cpu className="w-3.5 h-3.5 text-(--accent-primary)" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-(--accent-primary)/10 text-foreground"
                                        : "bg-(--bg-surface-2) text-(--text-secondary) border border-(--border-default)"
                                )}
                            >
                                <MessageContent content={getMessageText(msg)} />
                            </div>
                            {msg.role === "user" && (
                                <div className="w-7 h-7 rounded-lg bg-(--bg-surface-2) flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-(--text-muted)" />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}

                {/* Streaming indicator */}
                {status === "submitted" && (
                    <div className="flex items-center gap-2 text-(--text-muted) text-xs font-mono pl-10">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>processing…</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 pt-3 border-t border-(--border-default)">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask how I think…"
                        rows={1}
                        disabled={isProcessing}
                        className={cn(
                            "w-full resize-none rounded-xl border border-(--border-default) bg-(--bg-surface-1) px-4 py-3 pr-12",
                            "text-sm text-foreground placeholder:text-(--text-disabled)",
                            "focus:outline-none focus:border-(--accent-primary) transition-colors",
                            "font-mono"
                        )}
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !input.trim()}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                            input.trim() && !isProcessing
                                ? "text-(--accent-primary) hover:bg-(--accent-primary)/10"
                                : "text-(--text-disabled) cursor-not-allowed"
                        )}
                    >
                        <SendHorizonal className="w-4 h-4" />
                    </button>
                </form>
                <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[10px] text-(--text-disabled) font-mono">
                        Shift+Enter for newline
                    </span>
                    <span className="text-[10px] text-(--text-disabled) font-mono">
                        ujjwal.os // cto-sim
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Empty state with starter prompts ──────────────────
function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
    return (
        <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="p-3 rounded-xl bg-(--accent-primary)/10 mb-4">
                <Cpu className="w-6 h-6 text-(--accent-primary)" />
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">
                Ask how I think
            </h2>
            <p className="text-sm text-(--text-secondary) text-center mb-8 max-w-sm">
                Query my engineering decisions, experiments, and system architecture.
                Grounded in real data — no generic answers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {STARTERS.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => onSelect(prompt)}
                        className={cn(
                            "text-left px-4 py-3 rounded-xl border border-(--border-default)",
                            "text-xs text-(--text-secondary) leading-relaxed",
                            "hover:border-(--border-strong) hover:text-foreground transition-colors",
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

// ─── Simple markdown-ish content renderer ──────────────
function MessageContent({ content }: { content: string }) {
    const lines = content.split("\n");

    return (
        <div className="space-y-1.5">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;

                if (line.startsWith("## "))
                    return (
                        <div key={i} className="font-semibold text-foreground text-sm mt-2">
                            {line.slice(3)}
                        </div>
                    );
                if (line.startsWith("### "))
                    return (
                        <div key={i} className="font-medium text-foreground text-xs uppercase tracking-wider mt-2">
                            {line.slice(4)}
                        </div>
                    );

                if (line.startsWith("- ") || line.startsWith("* "))
                    return (
                        <div key={i} className="flex gap-2 pl-1">
                            <span className="text-(--accent-secondary) mt-0.5">•</span>
                            <span>{renderInline(line.slice(2))}</span>
                        </div>
                    );

                return <div key={i}>{renderInline(line)}</div>;
            })}
        </div>
    );
}

function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
            return (
                <span key={i} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                </span>
            );
        if (part.startsWith("`") && part.endsWith("`"))
            return (
                <code key={i} className="px-1 py-0.5 rounded bg-(--bg-surface-2) text-(--accent-secondary) text-[11px] font-mono">
                    {part.slice(1, -1)}
                </code>
            );
        return part;
    });
}
