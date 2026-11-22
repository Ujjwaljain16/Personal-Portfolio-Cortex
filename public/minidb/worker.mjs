// Runs the real MiniDB engine (an in-memory build) off the main thread.
// Protocol: {type:"init", engineUrl, poolSize} -> {type:"ready", ...state}
//           {type:"run", id, sql}               -> {type:"result", id, ...}

const MAX_ROWS = 200;
const MAX_EVENTS = 4000;

let db = null;
let events = [];
let tracing = false;

function onPageEvent(e) {
    if (tracing && events.length < MAX_EVENTS) events.push(e);
}

async function snapshotTrees() {
    const trees = [];
    tracing = false;
    for (const table of db.catalog.tables()) {
        const entry = db.catalog.getTable(table);
        for (const [name, idx] of Object.entries(entry.indexes)) {
            if (!idx.tree || typeof idx.tree.describe !== "function") continue;
            const shape = await idx.tree.describe();
            trees.push({ table: String(table), index: name, column: idx.column, ...shape });
        }
    }
    return trees;
}

function tableSummary() {
    return db.catalog.tables().map((t) => {
        const e = db.catalog.getTable(t);
        return {
            name: String(t),
            columns: e.schema.map((c) => ({ name: c.name, type: c.type })),
            indexes: Object.entries(e.indexes).map(([name, i]) => ({ name, column: i.column })),
            rowCount: e.stats?.rowCount ?? 0,
        };
    });
}

async function state() {
    return {
        tables: tableSummary(),
        trees: await snapshotTrees(),
        frames: db.bufferPool.snapshot(),
        stats: db.bufferPool.stats(),
        pages: db.diskManager.getPageCount(),
    };
}

const CITIES = ["Pune", "Delhi", "Mumbai", "Jaipur", "Indore", "Bhopal", "Nagpur", "Surat"];

async function seed() {
    await db.execute("CREATE TABLE users (id INT, name VARCHAR(24), city VARCHAR(16), age INT)");
    await db.execute("CREATE INDEX idx_users_id ON users (id)");
    await db.execute("CREATE TABLE orders (id INT, user_id INT, amount INT)");
    await db.execute("CREATE INDEX idx_orders_user ON orders (user_id)");
    // A fixed generator, so every visitor sees the same data and the same plans.
    let s = 7;
    const rand = (n) => {
        // mulberry32
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) % n;
    };
    for (let start = 1; start <= 2000; start += 100) {
        const rows = [];
        for (let i = start; i < start + 100; i++) {
            rows.push(`(${i}, 'user${i}', '${CITIES[rand(CITIES.length)]}', ${18 + rand(50)})`);
        }
        await db.execute(`INSERT INTO users VALUES ${rows.join(", ")}`);
    }
    for (let start = 1; start <= 3000; start += 100) {
        const rows = [];
        for (let i = start; i < start + 100; i++) rows.push(`(${i}, ${1 + rand(2000)}, ${5 + rand(495)})`);
        await db.execute(`INSERT INTO orders VALUES ${rows.join(", ")}`);
    }
    await db.execute("ANALYZE users");
    await db.execute("ANALYZE orders");
}

async function init({ engineUrl, poolSize }) {
    const t0 = performance.now();
    const { MiniDB } = await import(engineUrl);
    const loadMs = performance.now() - t0;
    db = await MiniDB.inMemory({ poolSize });
    db.bufferPool.onPageEvent = onPageEvent;
    const t1 = performance.now();
    await seed();
    const seedMs = performance.now() - t1;
    return { loadMs, seedMs, poolSize, ...(await state()) };
}

function plain(v) {
    return typeof v === "bigint" ? Number(v) : v;
}

async function run(sql) {
    const before = db.bufferPool.stats();
    events = [];
    tracing = true;
    const t0 = performance.now();
    let result;
    try {
        result = await db.execute(sql);
    } finally {
        tracing = false;
    }
    const ms = performance.now() - t0;
    return {
        ok: true,
        ms,
        columns: result.columns,
        rows: result.rows.slice(0, MAX_ROWS).map((r) => r.map(plain)),
        rowCount: result.rows.length,
        rowsAffected: result.rowsAffected,
        plan: result.plan ?? null,
        events,
        eventsTruncated: events.length >= MAX_EVENTS,
        before,
        ...(await state()),
    };
}

self.onmessage = async (msg) => {
    const data = msg.data;
    try {
        if (data.type === "init") {
            self.postMessage({ type: "ready", ...(await init(data)) });
        } else if (data.type === "run") {
            self.postMessage({ type: "result", id: data.id, ...(await run(data.sql)) });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (data.type === "init") {
            self.postMessage({ type: "fatal", message });
        } else {
            let extra = {};
            try {
                extra = { events, ...(await state()) };
            } catch {
                // State can be unreadable after an engine error; the message is what matters.
            }
            self.postMessage({ type: "result", id: data.id, ok: false, error: message, ...extra });
        }
    }
};
