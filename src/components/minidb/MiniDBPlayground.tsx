"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { MINIDB_ENGINE } from "@/data/minidbDemo";
import type { EngineState, Frame, PageEvent, PageKind, PlanInfo, QueryResult, ReadyMessage, TreeShape } from "./types";

const QUERY_TIMEOUT_MS = 8000;
const SHOWN_ROWS = 50;

const PRESETS: { label: string; sql: string }[] = [
    { label: "Index lookup", sql: "SELECT * FROM users WHERE id = 42" },
    { label: "Index range", sql: "SELECT id, name FROM users WHERE id >= 1990" },
    { label: "Full scan", sql: "SELECT name, city FROM users WHERE age = 30" },
    { label: "Join", sql: "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = 15" },
    { label: "EXPLAIN", sql: "EXPLAIN SELECT * FROM users WHERE id > 1990 AND age < 30" },
    { label: "LIMIT", sql: "SELECT * FROM orders LIMIT 5" },
    { label: "Insert", sql: "INSERT INTO users VALUES (2001, 'you', 'Pune', 30)" },
    { label: "Delete", sql: "DELETE FROM orders WHERE user_id = 30" },
    { label: "Not supported", sql: "SELECT city FROM users ORDER BY age" },
];

const POOL_SIZES = [8, 16, 64];

const KIND_COLOR: Record<PageKind, string> = {
    heap: "var(--accent-primary)",
    "btree-internal": "var(--accent-secondary)",
    "btree-leaf": "var(--accent-teal)",
    fsm: "var(--text-muted)",
    unknown: "var(--text-disabled)",
};

const KIND_LABEL: Record<PageKind, string> = {
    heap: "heap",
    "btree-internal": "B+ internal",
    "btree-leaf": "B+ leaf",
    fsm: "free-space map",
    unknown: "new",
};

type Status = { phase: "loading" } | { phase: "ready"; ready: ReadyMessage } | { phase: "fatal"; message: string };

export function MiniDBPlayground() {
    const workerRef = useRef<Worker | null>(null);
    const pending = useRef<{ id: number; sql: string; timer: ReturnType<typeof setTimeout> } | null>(null);
    const nextId = useRef(1);
    const [poolSize, setPoolSize] = useState(16);
    const [status, setStatus] = useState<Status>({ phase: "loading" });
    const [engine, setEngine] = useState<EngineState | null>(null);
    const [sql, setSql] = useState(PRESETS[0]!.sql);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const start = useCallback((size: number) => {
        workerRef.current?.terminate();
        if (pending.current) clearTimeout(pending.current.timer);
        pending.current = null;
        setRunning(false);
        setStatus({ phase: "loading" });
        const worker = new Worker("/minidb/worker.mjs", { type: "module" });
        workerRef.current = worker;
        worker.onmessage = (e: MessageEvent) => {
            const msg = e.data;
            if (msg.type === "ready") {
                setStatus({ phase: "ready", ready: msg as ReadyMessage });
                setEngine(msg as ReadyMessage);
            } else if (msg.type === "fatal") {
                setStatus({ phase: "fatal", message: msg.message });
            } else if (msg.type === "result" && pending.current && pending.current.id === msg.id) {
                const done = pending.current;
                clearTimeout(done.timer);
                const res = { ...(msg as QueryResult), sql: done.sql };
                pending.current = null;
                setRunning(false);
                setResult(res);
                if (res.frames && res.stats && res.trees && res.tables) {
                    setEngine({ frames: res.frames, stats: res.stats, trees: res.trees, tables: res.tables, pages: res.pages ?? 0 });
                }
            }
        };
        worker.onerror = (e) => setStatus({ phase: "fatal", message: e.message || "The engine failed to load." });
        worker.postMessage({ type: "init", engineUrl: new URL(MINIDB_ENGINE.file, window.location.href).href, poolSize: size });
    }, []);

    useEffect(() => {
        start(poolSize);
        return () => workerRef.current?.terminate();
        // The pool size is applied through the reset button and the size picker, not on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start]);

    const run = useCallback(
        (text: string) => {
            const worker = workerRef.current;
            if (!worker || status.phase !== "ready" || running || !text.trim()) return;
            const id = nextId.current++;
            setRunning(true);
            setNotice(null);
            const timer = setTimeout(() => {
                setNotice(
                    `Stopped after ${QUERY_TIMEOUT_MS / 1000} s and reset the database. MiniDB joins are nested loops, so a join without a selective WHERE reads the inner table once per outer row.`,
                );
                setResult(null);
                start(poolSize);
            }, QUERY_TIMEOUT_MS);
            pending.current = { id, sql: text, timer };
            worker.postMessage({ type: "run", id, sql: text });
        },
        [poolSize, running, start, status.phase],
    );

    const reset = (size: number) => {
        setPoolSize(size);
        setResult(null);
        setNotice(null);
        start(size);
    };

    const touched = useMemo(() => pageVisits(result?.events ?? []), [result]);

    return (
        <div className="space-y-8">
            <section aria-label="Query" className="rounded-lg border border-(--border-default) bg-(--bg-surface-1) p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                                setSql(p.sql);
                                run(p.sql);
                            }}
                            className="rounded-md border border-(--border-default) px-2.5 py-1 text-[13px] text-(--text-secondary) transition-colors hover:border-(--border-hover) hover:text-foreground focus-ring"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <label className="block">
                    <span className="sr-only">SQL</span>
                    <textarea
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                run(sql);
                            }
                        }}
                        rows={3}
                        spellCheck={false}
                        className="w-full resize-y rounded-md border border-(--border-default) bg-(--bg-primary) p-3 font-mono text-[14px] leading-relaxed text-foreground focus:border-(--accent-primary) focus:outline-none"
                    />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => run(sql)}
                        disabled={status.phase !== "ready" || running}
                        className="inline-flex items-center gap-2 rounded-md bg-(--accent-primary) px-4 py-2 text-[14px] font-medium text-(--bg-primary) transition-opacity disabled:opacity-50 focus-ring"
                    >
                        <Play size={15} aria-hidden />
                        {running ? "Running…" : "Run"}
                    </button>
                    <span className="text-[13px] text-(--text-muted)">Ctrl + Enter</span>
                    <div className="ml-auto flex items-center gap-2 text-[13px] text-(--text-secondary)">
                        <label htmlFor="pool-size">Buffer pool</label>
                        <select
                            id="pool-size"
                            value={poolSize}
                            onChange={(e) => reset(Number(e.target.value))}
                            className="rounded-md border border-(--border-default) bg-(--bg-primary) px-2 py-1 text-foreground focus-ring"
                        >
                            {POOL_SIZES.map((n) => (
                                <option key={n} value={n}>
                                    {n} frames ({(n * 4).toString()} KB)
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => reset(poolSize)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-(--border-default) px-2.5 py-1 hover:border-(--border-hover) hover:text-foreground focus-ring"
                        >
                            <RotateCcw size={13} aria-hidden /> Reset data
                        </button>
                    </div>
                </div>
                <StatusLine status={status} />
            </section>

            {notice && <p className="rounded-md border border-(--warning) px-4 py-3 text-[14px] text-(--text-secondary)">{notice}</p>}

            {result && <ResultPanel result={result} />}

            {result && (
                <div className="grid gap-8 lg:grid-cols-2">
                    <Panel title="Plan" note={result.plan ? "Estimated rows come from ANALYZE statistics; actual rows from this run." : undefined}>
                        {result.plan ? <PlanTree node={result.plan} /> : <Muted>No plan for this statement.</Muted>}
                    </Panel>
                    <Panel title="Page reads" note="Every page the query asked the buffer pool for, in order.">
                        <PageTrace events={result.events ?? []} truncated={result.eventsTruncated ?? false} />
                    </Panel>
                </div>
            )}

            {engine && (
                <>
                    <Panel
                        title="B+ tree indexes"
                        note="Each box is one 4 KB page. Pages this query read are numbered in the order they were visited."
                    >
                        <Trees trees={engine.trees} touched={touched} plan={result?.plan ?? null} />
                    </Panel>
                    <Panel
                        title="Buffer pool"
                        note={`${engine.frames.length} frames over ${engine.pages} pages. LRU-K (K = 2) chooses which page to evict when every frame is full.`}
                    >
                        <BufferPool frames={engine.frames} touched={touched} />
                        <p className="mt-4 text-[13px] text-(--text-secondary)">
                            Since reset, including the seed inserts: {engine.stats.hits.toLocaleString()} hits, {engine.stats.misses.toLocaleString()} misses,{" "}
                            {engine.stats.evictions.toLocaleString()} evictions, hit ratio {(engine.stats.hitRatio * 100).toFixed(1)}%.
                        </p>
                    </Panel>
                    <Panel title="Tables">
                        <ul className="grid gap-3 md:grid-cols-2">
                            {engine.tables.map((t) => (
                                <li key={t.name} className="rounded-md border border-(--border-default) p-3 text-[13px]">
                                    <p className="font-mono text-foreground">{t.name}</p>
                                    <p className="mt-1 font-mono text-(--text-secondary)">
                                        ({t.columns.map((c) => `${c.name} ${c.type}`).join(", ")})
                                    </p>
                                    <p className="mt-1 text-(--text-muted)">
                                        {t.rowCount.toLocaleString()} rows at last ANALYZE · index on{" "}
                                        {t.indexes.map((i) => i.column).join(", ") || "nothing"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </>
            )}
        </div>
    );
}

function StatusLine({ status }: { status: Status }) {
    if (status.phase === "loading") return <p className="text-[13px] text-(--text-muted)">Loading the engine and seeding 5,000 rows…</p>;
    if (status.phase === "fatal") return <p className="text-[13px] text-(--danger)">The engine could not start: {status.message}</p>;
    const r = status.ready;
    return (
        <p className="text-[13px] text-(--text-muted)">
            Engine loaded in {Math.round(r.loadMs)} ms; 5,000 rows inserted and analysed in {Math.round(r.seedMs)} ms, all in this tab.
        </p>
    );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
                {note && <p className="mt-1 text-[13px] text-(--text-muted)">{note}</p>}
            </div>
            {children}
        </section>
    );
}

function Muted({ children }: { children: React.ReactNode }) {
    return <p className="text-[14px] text-(--text-muted)">{children}</p>;
}

function ResultPanel({ result }: { result: QueryResult }) {
    if (!result.ok) {
        return (
            <section className="rounded-md border border-(--danger) px-4 py-3">
                <p className="font-mono text-[13px] text-(--text-muted)">{result.sql}</p>
                <p className="mt-1 text-[14px] text-foreground">{result.error}</p>
            </section>
        );
    }
    const rows = result.rows ?? [];
    const cols = result.columns ?? [];
    const isText = cols.length === 1 && rows.length === 1 && typeof rows[0]?.[0] === "string" && String(rows[0]?.[0]).includes("\n");
    return (
        <section className="space-y-2">
            <p className="text-[13px] text-(--text-secondary)">
                <span className="metric-value">{(result.rowCount ?? 0).toLocaleString()}</span> {result.rowCount === 1 ? "row" : "rows"} in{" "}
                <span className="metric-value">{(result.ms ?? 0).toFixed(1)} ms</span>
                {(result.rowCount ?? 0) > SHOWN_ROWS && ` · showing the first ${SHOWN_ROWS}`}
            </p>
            {isText ? (
                <pre className="overflow-x-auto rounded-md border border-(--border-default) bg-(--bg-surface-1) p-3 font-mono text-[13px] text-foreground">
                    {String(rows[0]![0])}
                </pre>
            ) : (
                <div className="max-h-[22rem] overflow-auto rounded-md border border-(--border-default)">
                    <table className="w-full border-collapse font-mono text-[13px]">
                        <thead className="sticky top-0 bg-(--bg-surface-2)">
                            <tr>
                                {cols.map((c, i) => (
                                    <th key={i} className="px-3 py-1.5 text-left font-medium text-(--text-secondary)">
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.slice(0, SHOWN_ROWS).map((r, i) => (
                                <tr key={i} className="border-t border-(--border-default)">
                                    {r.map((v, j) => (
                                        <td key={j} className="px-3 py-1 text-foreground">
                                            {v === null ? <span className="text-(--text-muted)">NULL</span> : String(v)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function PlanTree({ node, depth = 0 }: { node: PlanInfo; depth?: number }) {
    const off = node.actualRows !== undefined && node.estRows > 0 && (node.actualRows / node.estRows > 10 || node.estRows / Math.max(node.actualRows, 1) > 10);
    return (
        <div className={depth ? "ml-4 border-l border-(--border-default) pl-3" : ""}>
            <div className="py-1.5">
                <p className="text-[14px] text-foreground">
                    {node.label} {node.detail && <span className="font-mono text-[12.5px] text-(--text-secondary)">{node.detail}</span>}
                </p>
                <p className="font-mono text-[12px] text-(--text-muted)">
                    est ~{node.estRows.toLocaleString()} rows, cost {node.estCost.toFixed(1)}
                    {node.actualRows !== undefined && (
                        <span className={off ? "text-(--warning)" : undefined}>
                            {" "}
                            · actual {node.actualRows.toLocaleString()} rows
                        </span>
                    )}
                    {node.timeMs !== undefined && ` · ${node.timeMs.toFixed(2)} ms`}
                </p>
            </div>
            {node.children.map((c, i) => (
                <PlanTree key={i} node={c} depth={depth + 1} />
            ))}
        </div>
    );
}

type Visit = { order: number; hit: boolean };

/** First visit of each page in this query, and whether that first read was a hit. */
function pageVisits(events: PageEvent[]): Map<number, Visit> {
    const seen = new Map<number, Visit>();
    for (const e of events) {
        if ((e.type === "hit" || e.type === "miss" || e.type === "new") && !seen.has(e.pageId)) {
            seen.set(e.pageId, { order: seen.size + 1, hit: e.type === "hit" });
        }
    }
    return seen;
}

function PageTrace({ events, truncated }: { events: PageEvent[]; truncated: boolean }) {
    const reads = events.filter((e) => e.type === "hit" || e.type === "miss" || e.type === "new");
    if (reads.length === 0) return <Muted>This statement did not read any pages.</Muted>;
    const hits = reads.filter((e) => e.type === "hit").length;
    const misses = reads.filter((e) => e.type === "miss").length;
    const created = reads.filter((e) => e.type === "new").length;
    const evicted = events.filter((e) => e.type === "evict");
    const flushed = events.filter((e) => e.type === "flush").length;
    const byKind = new Map<PageKind, number>();
    for (const e of reads) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
    const shown = reads.slice(0, 120);
    return (
        <div className="space-y-3">
            <p className="text-[13px] text-(--text-secondary)">
                {count(reads.length, "page request")}: <span className="text-(--success)">{count(hits, "hit")}</span>,{" "}
                <span className="text-(--warning)">{count(misses, "miss", "misses")}</span>
                {created > 0 && `, ${count(created, "new page")}`}
                {evicted.length > 0 && `, ${count(evicted.length, "eviction")}`}
                {flushed > 0 && `, ${count(flushed, "dirty page")} written back`}
                {truncated && " (trace cut at 4,000 events)"}.
            </p>
            <p className="text-[12.5px] text-(--text-muted)">
                {[...byKind.entries()].map(([k, n]) => `${n.toLocaleString()} ${KIND_LABEL[k]}`).join(" · ")}
            </p>
            <ol className="flex flex-wrap gap-1.5" aria-label="Page requests in order">
                {shown.map((e, i) => (
                    <li
                        key={i}
                        title={`page ${e.pageId}, ${KIND_LABEL[e.kind]}, ${e.type}, frame ${e.frame}`}
                        className="rounded border px-1.5 py-0.5 font-mono text-[11.5px]"
                        style={{
                            borderColor: e.type === "hit" ? "var(--border-default)" : "var(--warning)",
                            boxShadow: `inset 3px 0 0 ${KIND_COLOR[e.kind]}`,
                            color: "var(--text-secondary)",
                        }}
                    >
                        p{e.pageId}
                    </li>
                ))}
                {reads.length > shown.length && (
                    <li className="px-1 text-[12px] text-(--text-muted)">+{(reads.length - shown.length).toLocaleString()} more</li>
                )}
            </ol>
            <Legend />
        </div>
    );
}

function count(n: number, one: string, many = `${one}s`) {
    return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

function Legend() {
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-(--text-muted)">
            {(["btree-internal", "btree-leaf", "heap", "fsm"] as PageKind[]).map((k) => (
                <li key={k} className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: KIND_COLOR[k] }} />
                    {KIND_LABEL[k]}
                </li>
            ))}
            <li className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm border border-(--warning)" />
                miss (read from disk)
            </li>
        </ul>
    );
}

function Trees({ trees, touched, plan }: { trees: TreeShape[]; touched: Map<number, Visit>; plan: PlanInfo | null }) {
    const usedIndex = useMemo(() => findIndexInPlan(plan, trees), [plan, trees]);
    const [picked, setPicked] = useState<string | null>(null);
    const current = trees.find((t) => t.index === (picked ?? usedIndex)) ?? trees[0];
    if (!current) return <Muted>No indexes.</Muted>;
    const levels = treeLevels(current);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Index">
                {trees.map((t) => (
                    <button
                        key={t.index}
                        type="button"
                        role="tab"
                        aria-selected={t.index === current.index}
                        onClick={() => setPicked(t.index)}
                        className={`rounded-md border px-2.5 py-1 font-mono text-[12.5px] focus-ring ${
                            t.index === current.index
                                ? "border-(--accent-teal) text-foreground"
                                : "border-(--border-default) text-(--text-secondary) hover:border-(--border-hover)"
                        }`}
                    >
                        {t.table}.{t.column}
                        {t.index === usedIndex && <span className="ml-1.5 text-(--accent-teal)">used</span>}
                    </button>
                ))}
            </div>
            <p className="text-[13px] text-(--text-secondary)">
                {current.index} on {current.table}({current.column}): height {current.height}, {current.nodes.length} pages,{" "}
                {current.nodes.filter((n) => n.isLeaf).reduce((s, n) => s + n.keys.length, 0).toLocaleString()} keys.
            </p>
            <div className="space-y-3 overflow-x-auto pb-1">
                {levels.map((level, depth) => (
                    <div key={depth} className="flex flex-wrap justify-center gap-2">
                        {level.map((n) => {
                            const v = touched.get(n.pageId);
                            return (
                                <div
                                    key={n.pageId}
                                    className="relative min-w-[5.5rem] rounded-md border px-2 py-1.5 text-center font-mono text-[11.5px] transition-colors"
                                    style={{
                                        borderColor: v ? (v.hit ? "var(--accent-teal)" : "var(--warning)") : "var(--border-default)",
                                        background: v ? "var(--bg-surface-2)" : "var(--bg-surface-1)",
                                    }}
                                    title={`page ${n.pageId}${v ? `, visited #${v.order} (${v.hit ? "hit" : "miss"})` : ""}`}
                                >
                                    {v && (
                                        <span className="absolute -right-1.5 -top-2 rounded-full bg-(--accent-teal) px-1.5 text-[10.5px] text-(--bg-primary)">
                                            {v.order}
                                        </span>
                                    )}
                                    <span className="block text-(--text-muted)">p{n.pageId}</span>
                                    <span className="block text-foreground">{keyRange(n)}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <p className="text-[12px] text-(--text-muted)">
                Internal pages show their separator keys; leaves show the range of keys they hold and link left to right.
            </p>
        </div>
    );
}

function keyRange(n: { keys: unknown[]; isLeaf: boolean }) {
    if (n.keys.length === 0) return "empty";
    const first = String(n.keys[0]);
    const last = String(n.keys[n.keys.length - 1]);
    if (!n.isLeaf) return n.keys.length <= 3 ? n.keys.map(String).join(" | ") : `${first} | … | ${last}`;
    return n.keys.length === 1 ? first : `${first}–${last}`;
}

function treeLevels(t: TreeShape) {
    const byId = new Map(t.nodes.map((n) => [n.pageId, n]));
    const levels: TreeShape["nodes"][] = [];
    let frontier = byId.has(t.rootPageId) ? [byId.get(t.rootPageId)!] : [];
    const seen = new Set<number>();
    while (frontier.length > 0) {
        levels.push(frontier);
        const next: TreeShape["nodes"] = [];
        for (const n of frontier) {
            seen.add(n.pageId);
            if (n.isLeaf) continue;
            for (const c of n.children) {
                const child = byId.get(c);
                if (child && !seen.has(c)) next.push(child);
            }
        }
        frontier = next;
    }
    return levels;
}

function findIndexInPlan(plan: PlanInfo | null, trees: TreeShape[]): string | null {
    if (!plan) return null;
    const stack = [plan];
    while (stack.length) {
        const n = stack.pop()!;
        if (n.kind === "phys_index_scan") {
            const hit = trees.find((t) => n.detail.includes(t.index));
            if (hit) return hit.index;
        }
        stack.push(...n.children);
    }
    return null;
}

function BufferPool({ frames, touched }: { frames: Frame[]; touched: Map<number, Visit> }) {
    return (
        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="Buffer pool frames">
            {frames.map((f) => {
                const v = f.pageId >= 0 ? touched.get(f.pageId) : undefined;
                return (
                    <li
                        key={f.frame}
                        className="rounded-md border px-2 py-1.5 font-mono text-[11.5px]"
                        style={{
                            borderColor: v ? (v.hit ? "var(--accent-teal)" : "var(--warning)") : "var(--border-default)",
                            boxShadow: f.pageId >= 0 ? `inset 0 3px 0 ${KIND_COLOR[f.kind]}` : undefined,
                        }}
                        title={f.pageId >= 0 ? `frame ${f.frame}: page ${f.pageId}, ${KIND_LABEL[f.kind]}${f.dirty ? ", dirty" : ""}` : `frame ${f.frame}: empty`}
                    >
                        <span className="block text-(--text-muted)">f{f.frame}</span>
                        <span className="block text-foreground">{f.pageId >= 0 ? `p${f.pageId}` : "·"}</span>
                        <span className="block text-[10.5px] text-(--text-muted)">
                            {f.dirty ? "dirty" : f.pageId >= 0 ? "clean" : "empty"}
                            {v ? (v.hit ? " · hit" : " · miss") : ""}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
