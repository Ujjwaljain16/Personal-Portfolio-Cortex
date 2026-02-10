"use client";

import { cn, formatTimestamp } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
}

interface ActivityFeedProps {
    maxItems?: number;
}

// Map GitHub event types to log entries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function githubEventToLog(event: any): LogEntry | null {
    const ts = new Date(event.created_at);
    const repo = event.repo?.name?.split("/")[1] ?? event.repo?.name ?? "";

    switch (event.type) {
        case "PushEvent": {
            const count = event.payload?.commits?.length ?? event.payload?.size ?? 0;
            const branch = event.payload?.ref?.replace("refs/heads/", "") ?? "main";
            const msg = event.payload?.commits?.[event.payload.commits.length - 1]?.message?.split("\n")[0] ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: "success",
                message: `[${repo}] pushed ${count} commit${count !== 1 ? "s" : ""} to ${branch}${msg ? ` — ${msg}` : ""}`,
            };
        }
        case "PublicEvent":
            return {
                id: event.id,
                timestamp: ts,
                level: "info",
                message: `[${repo}] is now public`,
            };
        case "CreateEvent": {
            const refType = event.payload?.ref_type ?? "branch";
            const ref = event.payload?.ref ?? "";

            // Handle repository creation (ref_type is 'repository')
            if (refType === "repository") {
                return {
                    id: event.id,
                    timestamp: ts,
                    level: "success",
                    message: `[${repo}] created repository`,
                };
            }

            return {
                id: event.id,
                timestamp: ts,
                level: "info",
                message: `[${repo}] created ${refType}${ref ? `: ${ref}` : ""}`,
            };
        }
        case "DeleteEvent": {
            const refType = event.payload?.ref_type ?? "branch";
            const ref = event.payload?.ref ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: "warn",
                message: `[${repo}] deleted ${refType}: ${ref}`,
            };
        }
        case "IssuesEvent": {
            const action = event.payload?.action ?? "opened";
            const title = event.payload?.issue?.title ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: action === "closed" ? "success" : "info",
                message: `[${repo}] issue ${action}: ${title}`,
            };
        }
        case "PullRequestEvent": {
            const action = event.payload?.action ?? "opened";
            const title = event.payload?.pull_request?.title ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: action === "closed" ? "success" : "info",
                message: `[${repo}] PR ${action}: ${title}`,
            };
        }
        case "WatchEvent":
            return {
                id: event.id,
                timestamp: ts,
                level: "debug",
                message: `[${repo}] starred`,
            };
        case "ForkEvent":
            return {
                id: event.id,
                timestamp: ts,
                level: "info",
                message: `[${repo}] forked`,
            };
        case "IssueCommentEvent": {
            const issueNum = event.payload?.issue?.number ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: "debug",
                message: `[${repo}] commented on #${issueNum}`,
            };
        }
        case "ReleaseEvent": {
            const tag = event.payload?.release?.tag_name ?? "";
            return {
                id: event.id,
                timestamp: ts,
                level: "success",
                message: `[${repo}] released ${tag}`,
            };
        }
        default:
            return null;
    }
}

async function fetchGitHubActivity(username: string, count: number): Promise<LogEntry[]> {
    try {
        const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" };
        const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        if (token) (headers as Record<string, string>)["Authorization"] = `token ${token}`;

        const res = await fetch(
            `https://api.github.com/users/${username}/events/public?per_page=${Math.min(count * 2, 100)}`,
            { headers }
        );
        if (!res.ok) {
            console.warn(`GitHub events API: ${res.status}`);
            return [];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events: any[] = await res.json();
        return events
            .map(githubEventToLog)
            .filter((e): e is LogEntry => e !== null)
            .slice(0, count);
    } catch (err) {
        console.error("Failed to fetch GitHub activity:", err);
        return [];
    }
}

// ─── Date grouping helpers ──────────────────────────────
function getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (eventDay.getTime() === today.getTime()) return "Today";
    if (eventDay.getTime() === yesterday.getTime()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(logs: LogEntry[]): { label: string; entries: LogEntry[] }[] {
    const groups: Map<string, LogEntry[]> = new Map();
    for (const log of logs) {
        const label = getDateLabel(log.timestamp);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(log);
    }
    return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

export function ActivityFeed({ maxItems = 8 }: ActivityFeedProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadEvents = async () => {
        setLoading(true);
        const entries = await fetchGitHubActivity("Ujjwaljain16", maxItems);
        if (entries.length > 0) {
            setLogs(entries);
            setLastUpdated(new Date());
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
        // Re-fetch every 2 minutes
        const interval = setInterval(loadEvents, 2 * 60 * 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxItems]);

    const levelColors: Record<LogLevel, string> = {
        info: "log-level-info",
        warn: "log-level-warn",
        error: "log-level-error",
        success: "log-level-success",
        debug: "text-[var(--text-muted)]",
    };

    const grouped = groupByDate(logs);

    return (
        <div className="surface-1 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="text-label">RECENT ACTIVITY</div>
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--success) opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-(--success)" />
                    </span>
                    <span className="text-[10px] font-mono text-(--text-muted)">LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-[10px] font-mono text-(--text-muted)">
                            {formatTimestamp(lastUpdated)}
                        </span>
                    )}
                    <button
                        onClick={loadEvents}
                        disabled={loading}
                        className="p-1 rounded hover:bg-(--bg-surface-2) transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={cn(
                            "w-3 h-3 text-(--text-muted)",
                            loading && "animate-spin"
                        )} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="font-mono text-xs"
            >
                {loading && logs.length === 0 ? (
                    <div className="space-y-2">
                        {[...Array(maxItems)].map((_, i) => (
                            <div key={i} className="h-4 rounded bg-(--bg-surface-2) animate-pulse" />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-(--text-muted) text-center py-4">
                        No recent GitHub activity
                    </div>
                ) : (
                    grouped.map((group) => (
                        <div key={group.label} className="mb-2 last:mb-0">
                            {/* Date separator */}
                            <div className="flex items-center gap-2 py-1">
                                <span className="text-[9px] uppercase tracking-widest text-(--text-muted) opacity-60">
                                    {group.label}
                                </span>
                                <div className="flex-1 h-px bg-(--border-default) opacity-40" />
                            </div>
                            {/* Events in this group */}
                            <div className="space-y-0.5">
                                {group.entries.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex gap-3 text-(--text-secondary) log-entry-interactive px-1 py-0.5"
                                    >
                                        <span className="text-(--text-muted) shrink-0">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                        <span
                                            className={cn(
                                                "shrink-0 uppercase w-16",
                                                levelColors[log.level]
                                            )}
                                        >
                                            {log.level}
                                        </span>
                                        <span className="truncate">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-3 pt-2 border-t border-(--border-default)">
                <div className="text-[10px] text-(--text-muted) font-mono">
                    Sourced from GitHub Events API — github.com/Ujjwaljain16
                </div>
            </div>
        </div>
    );
}
