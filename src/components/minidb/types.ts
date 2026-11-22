export type PageKind = "heap" | "btree-leaf" | "btree-internal" | "fsm" | "unknown";

export interface PageEvent {
    type: "hit" | "miss" | "new" | "evict" | "flush";
    pageId: number;
    frame: number;
    kind: PageKind;
    dirty?: boolean;
}

export interface Frame {
    frame: number;
    pageId: number;
    pinCount: number;
    dirty: boolean;
    kind: PageKind;
}

export interface PlanInfo {
    kind: string;
    label: string;
    detail: string;
    estRows: number;
    estCost: number;
    actualRows?: number;
    timeMs?: number;
    children: PlanInfo[];
}

export interface TreeNode {
    pageId: number;
    isLeaf: boolean;
    keys: (number | string | boolean | null)[];
    children: number[];
    nextLeafId: number;
}

export interface TreeShape {
    table: string;
    index: string;
    column: string;
    rootPageId: number;
    height: number;
    nodes: TreeNode[];
}

export interface PoolStats {
    hits: number;
    misses: number;
    evictions: number;
    dirtyPages: number;
    pinnedPages: number;
    hitRatio: number;
}

export interface TableInfo {
    name: string;
    columns: { name: string; type: string }[];
    indexes: { name: string; column: string }[];
    rowCount: number;
}

export interface EngineState {
    tables: TableInfo[];
    trees: TreeShape[];
    frames: Frame[];
    stats: PoolStats;
    pages: number;
}

export interface ReadyMessage extends EngineState {
    type: "ready";
    loadMs: number;
    seedMs: number;
    poolSize: number;
}

export interface QueryResult extends Partial<EngineState> {
    type: "result";
    id: number;
    ok: boolean;
    error?: string;
    ms?: number;
    columns?: string[];
    rows?: unknown[][];
    rowCount?: number;
    rowsAffected?: number;
    plan?: PlanInfo | null;
    events?: PageEvent[];
    eventsTruncated?: boolean;
    sql: string;
}
