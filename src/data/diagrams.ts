/**
 * One pipeline diagram per project. Every step restates something the project
 * page already says (approach or evidence), so a diagram never claims more than
 * the text does.
 */

export interface DiagramStep {
    title: string;
    detail: string;
}

export interface Diagram {
    caption: string;
    steps: DiagramStep[];
}

export const diagrams: Record<string, Diagram> = {
    recoveryos: {
        caption: "Authority flows one way. The model's output is an input to the policy engine and never reaches the executor; a test walks the syntax tree to check that.",
        steps: [
            { title: "Failed payment", detail: "Arrives as a Razorpay webhook, verified with HMAC-SHA256." },
            { title: "LLM investigator", detail: "Diagnoses the failure and may recommend an action. It cannot move money." },
            { title: "Policy and expected-value engine", detail: "Deterministic. Decides whether the action is allowed." },
            { title: "Idempotent executor", detail: "Idempotency key plus a PostgreSQL advisory lock. Replans from the outcome." },
            { title: "Audit trail and dashboard", detail: "Control tower, per-payment replanning and an audit explorer." },
        ],
    },
    minidb: {
        caption: "Storage at the bottom, a query path in the middle, and transactions wrapped around both.",
        steps: [
            { title: "SQL", detail: "Parsed with sql-parser-cst." },
            { title: "Binder and cost-based planner", detail: "ANALYZE statistics and EXPLAIN." },
            { title: "Executors", detail: "Volcano-style and vectorized." },
            { title: "Locks and write-ahead log", detail: "Strict two-phase locking, a wait-for-graph deadlock detector, ARIES-style recovery." },
            { title: "Buffer pool and B+ tree", detail: "LRU-K buffer pool over slotted-page heap files and a disk-backed B+ tree." },
        ],
    },
    fuze: {
        caption: "The two-stage recommendation pipeline is built and tested but is not serving traffic yet.",
        steps: [
            { title: "Content", detail: "Bookmarks and web clips." },
            { title: "RQ workers on Redis", detail: "Extract content and compute 384-dimension MiniLM embeddings." },
            { title: "PostgreSQL with pgvector", detail: "HNSW indexes built concurrently through Alembic migrations." },
            { title: "Search functions", detail: "Exposed as Postgres search functions." },
            { title: "Recommendations (behind flags)", detail: "ANN candidates, then re-ranking, with shadow evaluation and CI gates." },
        ],
    },
    "sse-observatory": {
        caption: "One upstream connection is shared by every tab; user code only ever runs in a worker that can be killed.",
        steps: [
            { title: "Express proxy", detail: "CORS and auth headers, SSRF guard, rate limiting, one-time tickets." },
            { title: "SharedWorker", detail: "One SSE connection multiplexed across tabs, with reconnect backoff." },
            { title: "Interceptor workers", detail: "Sandboxed pool with a 100 ms timeout; hung workers are terminated." },
            { title: "Query language", detail: "Recursive descent, compiled to closures (AND, OR, parentheses)." },
            { title: "Timeline and replay", detail: "Canvas timeline with seek, step and return to live." },
        ],
    },
    flashflow: {
        caption: "Everything outside the policy is held fixed, so a difference between two runs can only come from the policy.",
        steps: [
            { title: "Seeded scenario", detail: "The same traffic, topology, failures and seed for every policy." },
            { title: "Six routing policies", detail: "Each makes its own decisions in a virtual-time engine, or in a real net/http engine over a simulated link." },
            { title: "Event log", detail: "Dispatch and completion events." },
            { title: "Backlog reconstruction", detail: "Per-target queue depth rebuilt from the events." },
            { title: "Classifier", detail: "STABLE, ACUTE, CHRONIC or RECOVERY_LIMITED, from concentration and committed work." },
            { title: "Report", detail: "Explanation, stress map and dashboard." },
        ],
    },
    agentbrake: {
        caption: "Anything the proxy cannot classify is blocked, not forwarded.",
        steps: [
            { title: "Agent", detail: "Sends JSON-RPC over stdio." },
            { title: "AgentBrake", detail: "Buffers and parses each message. Unparseable input gets an error." },
            { title: "Policy chain", detail: "Allow and deny rules, argument regexes, rate and budget limits, circuit breaker." },
            { title: "MCP server", detail: "Started as a child process; receives only calls that passed." },
            { title: "Response", detail: "Tool errors are reported back to the circuit breaker." },
        ],
    },
    vaulttabs: {
        caption: "Snapshots are encrypted in the browser, but the account password reaches the server, so this is not zero-knowledge.",
        steps: [
            { title: "Extension", detail: "Captures open http(s) tabs and skips incognito tabs." },
            { title: "Encrypt in the browser", detail: "Random AES-256-GCM master key, fresh IV per snapshot." },
            { title: "Fastify and PostgreSQL", detail: "Store ciphertext and the wrapped keys." },
            { title: "PWA or another extension", detail: "Unwraps the master key with a key derived from the password (PBKDF2) and decrypts locally." },
        ],
    },
    campussync: {
        caption: "Only faculty-approved certificates are issued as credentials.",
        steps: [
            { title: "Student upload", detail: "The student uploads a certificate." },
            { title: "Gemini vision", detail: "Extracts the fields; regular expressions normalise them." },
            { title: "Faculty approval", detail: "A reviewer verifies or rejects." },
            { title: "Signed credential", detail: "RS256 JWS in a W3C-VC-shaped JSON, with revocation." },
            { title: "Public verification", detail: "Anyone can check a credential." },
        ],
    },
};
