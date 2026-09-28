/**
 * Portfolio projects.
 *
 * Every claim here was checked against the repository itself (code, tests,
 * result files) — see `evidence[].source` for the file. Where something is
 * unfinished, unmeasured or planned-only, it is listed under `limitations`
 * instead of being left out. Numbers without a benchmark behind them are not
 * quoted.
 */

export type ProjectTier = "flagship" | "more";
export type ProjectStatus = "ongoing" | "shipped" | "prototype" | "in-progress";

export interface Evidence {
    text: string;
    /** Path inside `repo` (resolved to a GitHub blob link). */
    source?: string;
}

export interface ProjectLink {
    label: string;
    href: string;
}

export interface ProjectImage {
    /** Path under /public. */
    src: string;
    alt: string;
    width: number;
    height: number;
}

export interface Gallery {
    /** wide: landscape screenshots; tall: full-page captures (cropped, open for full size); phone: portrait phone captures. */
    layout: "wide" | "tall" | "phone";
    items: ProjectImage[];
}

export interface Project {
    id: string;
    name: string;
    tier: ProjectTier;
    tagline: string;
    status: ProjectStatus;
    /** How it came about, stated plainly (hackathon, course, team, personal). */
    origin: string;
    period: string;
    problem: string;
    approach: string[];
    evidence: Evidence[];
    limitations: string[];
    tech: string[];
    /** `owner/name` on GitHub. */
    repo: string;
    links: ProjectLink[];
    /** Screenshots copied from the project's own repository. */
    gallery?: Gallery;
    /**
     * Concrete next steps, each taken from a limitation stated on the page.
     * They describe what fixing the gap would take; they are not promises.
     */
    next?: string[];
}

export interface AlsoBuilt {
    name: string;
    repo: string;
    line: string;
}

const gh = (repo: string) => `https://github.com/${repo}`;

export const projects: Project[] = [
    // ─── Flagship ──────────────────────────────────────────────────────────
    {
        id: "recoveryos",
        name: "RecoveryOS",
        tier: "flagship",
        tagline: "Recovers failed payments: an LLM may recommend, but only a deterministic policy engine may act.",
        status: "prototype",
        origin: "Razorpay Buildathon, Track 03",
        period: "Aug–Sep 2026",
        problem:
            "Failed payments can often be recovered by retrying at the right time and channel, but a wrong retry costs money. The system separates diagnosis from authority: an AI can suggest what to do, but it cannot move money.",
        approach: [
            "An LLM investigator diagnoses each failed payment and may recommend an action. A deterministic policy and expected-value engine decides whether that action is allowed.",
            "An idempotent executor performs the action and replans from the outcome. Work is coordinated with Redis streams and workers on PostgreSQL, with a scheduler lease and reclaim.",
            "A Next.js dashboard shows a control tower, per-payment replanning, an audit explorer and experiment results.",
        ],
        evidence: [
            {
                text: "Execution is idempotent: an idempotency key plus a PostgreSQL advisory lock, with a unique-constraint backstop. An integration test races two real threads against it.",
                source: "services/execution_engine/idempotency.py",
            },
            {
                text: "A test walks the syntax tree to prove that execution code cannot reference the AI recommendation.",
                source: "tests/integration/test_diagnosis_has_no_decision_authority.py",
            },
            {
                text: "Razorpay webhook signatures are verified with HMAC-SHA256 and a constant-time comparison.",
                source: "integrations/razorpay/webhooks.py",
            },
            {
                text: "555 test functions across unit, integration, evaluation and performance suites, run against real PostgreSQL sessions. CI runs lint, security gates, unit and integration jobs.",
            },
            {
                text: "Multi-seed simulator evaluation: across 5 independent 10,000-payment runs, mean incremental recovered revenue of ₹73,182 per run (95% CI ₹52,919 to ₹93,445), with the payment-level superset property holding on every seed. A script regenerates the result file.",
                source: "tests/evaluation/multi_seed_runner.py",
            },
        ],
        limitations: [
            "Benchmarks run against a simulator I wrote, not real payment traffic.",
            "Real-model evidence is small: 4 payments and 2 real Gemini recommendations.",
            "Most of the measured lift comes from the deterministic engine, not the LLM. AI fusion is off by default.",
            "A message that always fails is retried without a cap, opt-out is not re-checked when a message is executed, and the /metrics endpoint is unauthenticated.",
            "No live demo (it needs PostgreSQL and Redis). Screenshots are in the repository.",
            "Built with an AI coding assistant: 16 of the 139 commits carry a Claude co-author trailer.",
        ],
        tech: ["Python", "FastAPI", "PostgreSQL", "Alembic", "Redis Streams", "Next.js", "Gemini", "Razorpay", "Prometheus", "Docker"],
        next: [
            "Cap retries and add a dead-letter queue, so a message that always fails stops being retried.",
            "Re-check the customer's opt-out at execution time, not only when the decision is made.",
            "Put authentication on the /metrics endpoint.",
            "Evaluate against real payment traffic, or a larger set of real model recommendations, instead of only the simulator.",
        ],
        repo: "Ujjwaljain16/RecoveryOS",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/RecoveryOS") }],
        gallery: {
            layout: "tall",
            items: [
                {
                    src: "/projects/recoveryos/control-tower.webp",
                    alt: "RecoveryOS control tower: recovered amount, incremental recovery and recovery rate, a per-bank health table, an action queue and active recovery missions.",
                    width: 1280,
                    height: 1212,
                },
                {
                    src: "/projects/recoveryos/payment-detail-replan.webp",
                    alt: "A payment's recovery mission timeline: an attempt fails, the system reinvestigates and replans, and a later attempt succeeds.",
                    width: 1280,
                    height: 3040,
                },
                {
                    src: "/projects/recoveryos/audit-explorer.webp",
                    alt: "Audit chain for one payment: failure, diagnosis marked as a deterministic fallback with no LLM involved, action options, expected value, policy verdict and execution.",
                    width: 1280,
                    height: 1916,
                },
                {
                    src: "/projects/recoveryos/experiments.webp",
                    alt: "Recovery experiment page: a five-seed simulator comparison of baseline against RecoveryOS with per-seed results and the AI's measured contribution.",
                    width: 1280,
                    height: 1953,
                },
                {
                    src: "/projects/recoveryos/payment-detail-safety-escalation.webp",
                    alt: "A payment escalated by policy after an AI risk signal flagged high fraud risk, instead of being retried.",
                    width: 1280,
                    height: 2091,
                },
            ],
        },
    },
    {
        id: "minidb",
        name: "MiniDB",
        tier: "flagship",
        tagline: "A relational database built from scratch: B+ tree, buffer pool, SQL, optimizer, locking and crash recovery.",
        status: "prototype",
        origin: "Course capstone (two people)",
        period: "Jun 2026",
        problem:
            "Understand how a relational database really works by building the whole stack: storage, indexing, SQL, query optimization, concurrency control and recovery from crashes.",
        approach: [
            "Storage: slotted-page heap files, a disk-backed B+ tree (split, merge, borrow, bulk load) and an LRU-K buffer pool.",
            "Query path: SQL is parsed with sql-parser-cst, then goes through my own binder, a cost-based planner (ANALYZE statistics, EXPLAIN) and Volcano-style plus vectorized executors.",
            "Transactions: strict two-phase locking with a wait-for-graph deadlock detector, and write-ahead logging with ARIES-style analysis, redo and undo recovery plus checkpoints.",
        ],
        evidence: [
            {
                text: "133 tests in 26 suites pass. They include a crash matrix that simulates failures between a WAL flush and a page flush, a 1,000-operation SQL fuzz test against a reference model, and deadlock tests.",
                source: "MiniDB_Projects/Team_ARIES_Recovery/tests/integration/crash_matrix.test.ts",
            },
            {
                text: "A 683-line disk-backed B+ tree with split, merge, borrow and bulk-load, and its root persisted through the catalog.",
                source: "MiniDB_Projects/Team_ARIES_Recovery/src/index/BPlusTree.ts",
            },
            {
                text: "The buffer pool flushes the log up to a page's LSN before writing the page (write-ahead logging), and recovery runs analysis, redo and undo passes.",
                source: "MiniDB_Projects/Team_ARIES_Recovery/src/recovery/CrashRecovery.ts",
            },
            {
                text: "Lock manager with shared and exclusive modes, FIFO queues and upgrades. The deadlock detector aborts the youngest transaction in a cycle.",
                source: "MiniDB_Projects/Team_ARIES_Recovery/src/concurrency/LockManager.ts",
            },
            {
                text: "Benchmarks are scripts, not screenshots. The vectorized executor reached about 1.2 to 2.2× over the Volcano one, not the 10× I aimed for, and the benchmark doc explains why.",
                source: "MiniDB_Projects/Team_ARIES_Recovery/docs/BENCHMARKS.md",
            },
        ],
        limitations: [
            "An educational engine, not production software, built with a teammate for a course.",
            "No MVCC. The catalog file is not protected by the WAL. Recovery does not write compensation log records.",
            "Aborting a transaction does not undo its changes yet, a second crash right after recovery loses committed rows in a test, and the planner can pick an index for range predicates the index scan can't execute. All were found while researching this page and are not fixed.",
            "The real project sits in a nested folder of the repository, so the repo root can be confusing.",
        ],
        tech: ["TypeScript", "Node.js", "Jest", "sql-parser-cst"],
        next: [
            "Make aborting a transaction undo its changes.",
            "Fix recovery so a second crash straight after recovery does not lose committed rows.",
            "Stop the planner choosing an index for range predicates the index scan cannot run.",
            "Put the catalog file under the write-ahead log.",
        ],
        repo: "Ujjwaljain16/MiniDB",
        links: [
            { label: "Source on GitHub", href: gh("Ujjwaljain16/MiniDB") },
            { label: "Demo recording (GIF, 11 MB)", href: "https://github.com/Ujjwaljain16/MiniDB/blob/HEAD/demodb.gif" },
        ],
    },
    {
        id: "fuze",
        name: "Fuze",
        tier: "flagship",
        tagline: "Semantic bookmark manager: pgvector search, a worker pipeline, and recommendations gated by regression tests.",
        status: "ongoing",
        origin: "Personal project, ongoing",
        period: "Jul 2025 – present · 455 commits",
        problem:
            "Saved bookmarks and posts pile up across tabs and apps and can't be searched by meaning.",
        approach: [
            "RQ workers on Redis extract content and compute 384-dimension MiniLM embeddings, which are stored in PostgreSQL with pgvector.",
            "Search uses HNSW indexes built concurrently through Alembic migrations and exposed as Postgres search functions.",
            "A rebuilt two-stage recommendation pipeline (ANN candidates, then re-ranking) exists behind feature flags, with shadow evaluation and CI gates. It is not serving production traffic yet.",
        ],
        evidence: [
            {
                text: "HNSW indexes (m=16, ef_construction=64) built with CREATE INDEX CONCURRENTLY inside an Alembic migration.",
                source: "backend/alembic/versions/0003_hnsw_indexes.py",
            },
            {
                text: "A golden-set regression test in CI requires NDCG@10 and MRR of at least 0.85 on four queries. It compares paths that share one engine, so it is a regression guard, not a quality measurement.",
                source: "backend/tests/test_golden_dataset_regression.py",
            },
            {
                text: "Reliability primitives: a circuit breaker, a distributed lock, an event and unit-of-work layer, and account lockout.",
                source: "backend/core/circuit_breaker.py",
            },
            {
                text: "About 207 test functions in 65 files, 7 GitHub Actions workflows, 10 migrations and 6 ADRs.",
            },
            {
                text: "Local benchmark (400 seeded rows, local PostgreSQL, 30 iterations): ANN search p50 0.64 ms and p99 1.02 ms; embedding generation on a cache miss p50 99 ms.",
            },
        ],
        limitations: [
            "The hosted backend on Hugging Face Spaces is paused, so the live frontend cannot complete requests. Run it locally with the Quick Start.",
            "Some optimisation figures in the repository docs have no benchmark behind them, so they are not repeated here.",
            "In shadow mode the new recommendation pipeline currently returns an empty list, because no unit of work is passed to it. Turning on the cutover flag would serve that empty list.",
            "Parts were built with an AI coding assistant: some commits carry a Claude co-author trailer, and gaps.md is AI-written.",
        ],
        tech: ["Python", "Flask", "PostgreSQL", "pgvector", "Redis", "RQ", "SentenceTransformers", "React", "Alembic", "GitHub Actions"],
        next: [
            "Pass a unit of work to the new recommendation pipeline so shadow mode returns real results, before turning on the cutover flag.",
            "Back the optimisation figures in the repository docs with benchmarks, or remove them.",
            "Bring the hosted backend back so the live frontend works.",
        ],
        repo: "Ujjwaljain16/Fuze",
        links: [
            { label: "Source on GitHub", href: gh("Ujjwaljain16/Fuze") },
            { label: "Frontend (backend offline)", href: "https://itsfuze.vercel.app" },
        ],
    },
    {
        id: "sse-observatory",
        name: "SSE-Observatory",
        tier: "flagship",
        tagline: "A browser-based debugger for Server-Sent Events: query language, replay, and multi-tab stream sharing.",
        status: "prototype",
        origin: "Personal project",
        period: "Feb–Mar 2026",
        problem:
            "Debugging an SSE stream usually means curl and scrolling logs. There is no easy way to filter, correlate or replay a live stream.",
        approach: [
            "A SharedWorker multiplexes one SSE connection across browser tabs, with reconnect backoff.",
            "User-written interceptors run in a sandboxed worker pool with a 100 ms timeout and are terminated if they hang.",
            "Events are filtered with a recursive-descent query language (AND, OR, parentheses) compiled to closures. A canvas timeline and time-travel playback (seek, step, return to live) support replay.",
            "An Express proxy handles CORS and auth headers, with an SSRF guard, rate limiting and short-lived one-time tickets.",
        ],
        evidence: [
            {
                text: "One shared SSE connection per stream across tabs, with reconnect backoff.",
                source: "src/workers/sharedSSEWorker.ts",
            },
            {
                text: "Interceptors are isolated in workers and killed on timeout.",
                source: "src/utils/interceptorSandbox.ts",
            },
            {
                text: "Recursive-descent parser that compiles queries into predicate functions.",
                source: "src/utils/queryParser.ts",
            },
            {
                text: "Server-side SSRF guard (private-IP and hostname checks) and rate limiting in the proxy.",
                source: "server.js",
            },
            {
                text: "About 103 unit tests plus 18 Playwright end-to-end tests, including reconnect-storm, memory-pressure and worker-death scenarios.",
            },
        ],
        limitations: [
            "Events are held in a capped array (1,000) rather than a true ring buffer.",
            "Interceptor workers are killed on timeout, but they are not isolated from the network.",
            "No CI workflow yet.",
        ],
        tech: ["TypeScript", "React", "Vite", "Web Workers", "SharedWorker", "IndexedDB", "Express", "Vitest", "Playwright"],
        next: [
            "Replace the capped array with a real ring buffer.",
            "Isolate interceptor workers from the network, not only kill them on timeout.",
            "Add a CI workflow.",
        ],
        repo: "Ujjwaljain16/SSE-Observatory",
        links: [
            { label: "Live demo", href: "https://sse-observatory.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/SSE-Observatory") },
        ],
        gallery: {
            layout: "wide",
            items: [
                {
                    src: "/projects/sse-observatory/monitor-mode.webp",
                    alt: "Monitor mode: connect to an SSE endpoint, optionally through the proxy, with a query engine for filtering and playback controls.",
                    width: 1024,
                    height: 576,
                },
                {
                    src: "/projects/sse-observatory/event-stream.webp",
                    alt: "Live event stream showing captured JSON events with compare and copy actions and a timeline scrubber.",
                    width: 1024,
                    height: 576,
                },
                {
                    src: "/projects/sse-observatory/multi-stream.webp",
                    alt: "Multi-stream mode: several SSE endpoints added as lanes to correlate events on one timeline.",
                    width: 1024,
                    height: 576,
                },
                {
                    src: "/projects/sse-observatory/mock-server.webp",
                    alt: "Mock server: upload a recorded .sse-record file and replay it locally at 0.5×, 1× or 2× speed.",
                    width: 1024,
                    height: 576,
                },
            ],
        },
    },

    // ─── More projects ─────────────────────────────────────────────────────
    {
        id: "flashflow",
        name: "FlashFlow",
        tier: "flagship",
        tagline: "A Go lab that replays routing policies on identical traffic and classifies why one of them collapses under load.",
        status: "prototype",
        origin: "Personal project",
        period: "Aug–Sep 2026 · 226 commits on 5 days",
        problem:
            "A single latency benchmark cannot show why a load-balancing policy collapses, because traffic, capacity, failures and cache state all change at once. FlashFlow fixes the traffic, topology, failures and seed, lets each policy make its own routing decisions, and rebuilds queue growth from the dispatch and completion events.",
        approach: [
            "A deterministic virtual-time engine runs six routing policies on the same seeded arrival trace. A second engine runs real net/http servers in one process over a simulated link.",
            "A backlog reconstruction rebuilds per-target queue depth from events, and a classifier labels each run STABLE, ACUTE_COLLAPSE, CHRONIC_COLLAPSE or RECOVERY_LIMITED from traffic concentration and committed work.",
            "Each research stage is written up against a claim ledger. Later stages retired or narrowed earlier claims, and in-repo audits corrected overclaims in the docs.",
        ],
        evidence: [
            {
                text: "go test ./... on a fresh clone: 24 packages pass, 503 top-level tests, 0 failures. go build, go vet and gofmt are clean. About 46,900 lines of Go, of which 20,284 are 89 single-file experiment programs.",
                source: "internal/proxy/proxy_test.go",
            },
            {
                text: "Six policies are compared: round-robin, weighted round-robin, least-connections, EWMA, power-of-two-choices by in-flight count, and an adaptive weighted policy.",
                source: "internal/replay/policies.go",
            },
            {
                text: "Re-running the flagship experiment (seeds 16000–16002) reproduced the committed result file except for its timestamp. Re-running the diagnostic report reproduced the documented labels for all six policies.",
                source: "experiments/016-final-synthesis/results/016-flagship-results.json",
            },
            {
                text: "Load-aware routing was tested against load-blind routing at 8 targets and lost: round-robin beat EWMA in 10 of 10 seeds. That retired a claim from an earlier stage.",
                source: "experiments/014-scale-topology/results/014I-statistical-confirmation.json",
            },
            {
                text: "A claim that one policy had the worst P99 in every seed was checked against its own result file, found false for one seed, and retracted in a follow-up commit.",
                source: "docs/StageArtifacts/Stage16-ClaimLedger.md",
            },
        ],
        limitations: [
            "Everything numerical is a simulation or an in-process run on one Windows machine. Targets are single FIFO queues with fixed service times. No code starts containers, and nothing ran against real traffic.",
            "The classifier's two thresholds were tuned against the same six outcomes it then reproduces, with no held-out scenario, so that agreement is a consistency check and not validation. It also labels weighted round-robin ACUTE_COLLAPSE even though that policy has the lowest P99.",
            "The dashboard and README quote \"8x\" for EWMA against the adaptive policy. That figure is EWMA against its own Capacity=0 baseline; the policy-to-policy gap is about 4.6–4.7x.",
            "Some recorded numbers are stale. A re-run of the keep-alive throughput test gave 2.15x where the docs say 3.06x, and the Stage 8 tuner figures moved after later seed changes.",
            "The \"independent\" audits are documents by the author, one run by 12 parallel AI agents. None is third-party review.",
            "Built with an AI coding assistant: at least 119 of the first 221 commits carried a Claude co-author trailer before a history rewrite removed most of them, and 28 of the current 226 still do. The commit history is also compressed: 214 of the 226 commits fall on four days.",
        ],
        tech: ["Go", "net/http", "GitHub Actions", "JavaScript dashboard", "Prometheus text format"],
        next: [
            "Validate the classifier's thresholds on a scenario it was not tuned on.",
            "Fix the README and dashboard \"8x\" figure, which is EWMA against its own baseline and not against the adaptive policy.",
            "Re-run the numbers that have gone stale, such as keep-alive throughput and the Stage 8 tuner, and update the docs.",
        ],
        repo: "Ujjwaljain16/FlashFlow",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/FlashFlow") }],
        gallery: {
            layout: "wide",
            items: [
                {
                    src: "/projects/flashflow/compare.webp",
                    alt: "FlashFlow Compare tab: P99 latency for six routing policies with their failure classification, and bar charts of traffic concentration and committed work.",
                    width: 1600,
                    height: 773,
                },
                {
                    src: "/projects/flashflow/diagnose.webp",
                    alt: "FlashFlow Diagnose tab: an eight-step explanation of why round-robin collapsed, and the classification of every policy with its committed work.",
                    width: 1600,
                    height: 773,
                },
                {
                    src: "/projects/flashflow/stress-map.webp",
                    alt: "FlashFlow Stress Map: a three by three grid of topology heterogeneity against workload shape, coloured by failure classification.",
                    width: 1600,
                    height: 773,
                },
            ],
        },
    },
    {
        id: "bhttp-1",
        name: "BHTTP-1",
        tier: "more",
        tagline: "A binary, HTTP-like protocol over persistent TCP, written in Go with a spec, server, client and chaos proxy.",
        status: "prototype",
        origin: "Personal project",
        period: "Sep 2026",
        problem:
            "Learn what HTTP does for you by designing a small binary protocol and making its parser survive hostile input.",
        approach: [
            "A 12-byte frame header (length, type, flags, stream id) with request, response, data and error frames.",
            "A reference server (bserve), a client (bcurl), a chaos proxy (bchaos) that splits reads to one byte and injects unknown frames, and independent Python interop clients.",
        ],
        evidence: [
            {
                text: "Frame length is validated before any allocation, and unknown frame types are skipped by their length.",
                source: "internal/frame/reader.go",
            },
            { text: "Four fuzz targets, and the Go test suite (about 370 test runs) passes." },
            { text: "Written spec, wire-format document and an annotated hexdump of a real captured exchange." },
        ],
        limitations: ["Version 1 handles one request at a time: no multiplexing and no TLS.", "Standard library only; not deployed."],
        tech: ["Go", "Python", "Docker"],
        repo: "Ujjwaljain16/BHTTP-1-HTTP-in-Binary",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/BHTTP-1-HTTP-in-Binary") }],
    },
    {
        id: "gitissue",
        name: "GitIssue",
        tier: "more",
        tagline: "Duplicate GitHub issue detection: signed webhooks into Redis Streams into pgvector search.",
        status: "prototype",
        origin: "Personal project",
        period: "Mar 2026 · two days",
        problem: "Large repositories accumulate duplicate issues. Find likely duplicates when an issue arrives.",
        approach: [
            "Webhooks are HMAC-verified and pushed onto a Redis Stream. Workers process them at-least-once and reclaim stalled messages, with a dead-letter stream for failures.",
            "Issues are embedded (384 dimensions) into PostgreSQL with an HNSW index alongside a full-text index, and scored with semantic, keyword, structural and label signals.",
        ],
        evidence: [
            {
                text: "Redis Streams consumer groups with XAUTOCLAIM reclaim and a dead-letter stream.",
                source: "app/queue/redis_stream.py",
            },
            { text: "115 tests collected across 20 files, including hybrid scoring, worker processing and webhook signatures." },
        ],
        limitations: [
            "Built in two days. The evaluation set is tiny (20 labels), so I don't quote precision or recall.",
            "No CI and not deployed.",
        ],
        tech: ["Python", "FastAPI", "Redis Streams", "PostgreSQL", "pgvector", "sentence-transformers", "Docker"],
        repo: "Ujjwaljain16/GitIssue",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/GitIssue") }],
    },
    {
        id: "lexis-ai",
        name: "Lexis AI",
        tier: "more",
        tagline: "Adaptive learning platform: turns a PDF into a concept graph and a personalised study plan.",
        status: "prototype",
        origin: "Team project (4 contributors)",
        period: "Jun 2026",
        problem: "Textbooks are linear, but learners aren't. Build a prerequisite graph from a book and plan study around what each learner already knows.",
        approach: [
            "A resumable, checkpointed LLM pipeline extracts concepts and relationships from a PDF. PostgreSQL is the source of truth and Neo4j holds the graph projection.",
            "Cycles in the prerequisite graph are detected and repaired by dropping the weakest edge, and the curriculum is planned as a topological order.",
        ],
        evidence: [
            { text: "About 78% of the commits are mine. Teammates wrote the FSRS spaced-repetition mastery engine, the Neo4j projection and the evaluation harness, plus quiz gating and the landing page." },
            { text: "38 backend tests pass (assessment walk, curriculum planner, FSRS mastery, chunking)." },
        ],
        limitations: [
            "An evaluation harness and nine golden datasets exist, but no results are committed, so I don't claim evaluation numbers.",
            "No CI, and part of the architecture doc is out of date.",
        ],
        tech: ["Python", "FastAPI", "PostgreSQL", "Neo4j", "Gemini", "Next.js", "Docker"],
        repo: "Ujjwaljain16/GenAI-34",
        links: [
            { label: "Live demo", href: "https://gen-ai-34.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/GenAI-34") },
        ],
    },
    {
        id: "agentbrake",
        name: "AgentBrake",
        tier: "more",
        tagline: "A stdio proxy that intercepts an AI agent's MCP tool calls and enforces policies before they run.",
        status: "shipped",
        origin: "Personal project, one-day build",
        period: "Feb 2026 · fixes Sep 2026",
        problem: "Agents get tools such as file access and shell. Enforce limits on those calls without modifying the agent.",
        approach: [
            "The proxy spawns the MCP server as a child process, parses JSON-RPC on stdin, runs each tool call through a chain of policy classes, then forwards or blocks it.",
            "Policies are configured in YAML validated with zod: per-tool allow/deny rules on arguments, rate and budget limits.",
        ],
        evidence: [
            {
                text: "Per-argument regex allow and deny rules, so a tool can be allowed while sensitive paths are blocked.",
                source: "src/policy/policies/GranularAccessPolicy.ts",
            },
            {
                text: "Fails closed: unparseable input, batches, malformed tool calls and policy errors are answered with a JSON-RPC error instead of being forwarded, and an invalid or missing policy file makes the proxy refuse to start. Tests split a tool call at every byte boundary and check the policy still applies.",
                source: "tests/proxy.test.ts",
            },
            {
                text: "The circuit breaker is fed real tool errors from the server's responses, so it can trip.",
                source: "src/proxy/interceptor.ts",
            },
            { text: "85 tests pass. Published to npm as agentbrake, with rogue-agent attack demos in the repository." },
        ],
        limitations: [
            "Human approval is not implemented: a call that needs approval is refused with a pending error and nothing can approve it. A sandbox action is enforced as a block.",
            "Stdio only, and not a sandbox: argument rules are regular expressions, which are bypassable, and a server that ignores the proxy is out of scope.",
            "The budget policy counts calls at a flat cost; it does not track tokens or real spend.",
            "The first version failed open: any line the proxy could not parse, including a tool call split across stdin chunks, was forwarded unchecked, and an invalid policy file disabled enforcement. Both were fixed in Sep 2026 (see the decisions page).",
        ],
        tech: ["TypeScript", "Node.js", "zod", "Jest", "Docker"],
        next: [
            "Build human approval: a way to approve or deny a pending call that the agent cannot use on itself.",
            "Track tokens or real spend in the budget policy instead of a flat cost per call.",
            "Publish a new npm release with the fail-closed fixes.",
        ],
        repo: "Ujjwaljain16/AgentBrake",
        links: [
            { label: "Source on GitHub", href: gh("Ujjwaljain16/AgentBrake") },
            { label: "Package on npm", href: "https://www.npmjs.com/package/agentbrake" },
        ],
    },
    {
        id: "migratedb",
        name: "migrateDB",
        tier: "more",
        tagline: "A TypeScript migration CLI and library with dependency-ordered execution, published to npm.",
        status: "shipped",
        origin: "Personal project",
        period: "Nov–Dec 2025",
        problem: "Migrations often depend on each other, and file-name order doesn't express that.",
        approach: [
            "Migrations declare dependencies with a comment annotation. A depth-first topological sort orders them and detects cycles and missing dependencies.",
            "A single-row lock table prevents concurrent runs. Migrations are checksummed with SHA-256, can be filtered by environment and run in dry-run mode.",
        ],
        evidence: [
            { text: "Integration tests run against real PostgreSQL through Testcontainers, and CI and release workflows are set up." },
            { text: "Published to npm as @ujjwaljain16/migratedb (v1.0.1). About 327 downloads over its lifetime." },
        ],
        limitations: [
            "The source repository is currently private; only the npm package is public.",
            "MySQL and SQLite adapters exist but are not tested. The lock has no stale-lock timeout, so a killed run needs the lock row deleted by hand, and a SQLite-only install fails looking for the pg module.",
            "Database drivers are peer dependencies that recent npm versions install automatically, so \"zero dependencies\" only describes direct dependencies.",
        ],
        tech: ["TypeScript", "Node.js", "PostgreSQL", "MySQL", "SQLite", "Testcontainers"],
        repo: "Ujjwaljain16/migratedb",
        links: [{ label: "Package on npm", href: "https://www.npmjs.com/package/@ujjwaljain16/migratedb" }],
    },
    {
        id: "campussync",
        name: "CampusSync",
        tier: "more",
        tagline: "Multi-tenant certificate verification for universities and recruiters.",
        status: "prototype",
        origin: "Personal project",
        period: "Sep–Dec 2025 · 165 commits",
        problem: "Certificates are checked by hand and are easy to forge, so recruiters can't trust the ones they receive.",
        approach: [
            "Students upload certificates; Gemini vision extracts the fields and regular expressions normalise them; faculty approve.",
            "Approved certificates are issued as signed credentials (RS256 JWS in a W3C-VC-shaped JSON) with revocation and public verification.",
        ],
        evidence: [
            { text: "101 API route files (138 handlers), guarded by role and organisation checks." },
            { text: "91 passing tests across 6 files, and architecture documents in my-app/docs." },
            {
                text: "A Sep 2026 security review of every route found and fixed real holes: role assignment and signup that did not require a session, credential issuing for arbitrary claims, unauthenticated document-status routes that used the service role, unsigned webhooks and open redirects. Dependency audit findings went from 71 to 2.",
                source: "my-app/src/lib/safeRedirect.ts",
            },
        ],
        limitations: [
            "Credentials are JWT-style, not full W3C proofs, and signing keys are held in memory.",
            "The review found that the early version was much less secure than the README suggested. The fixes are checked by typecheck, lint, the unit tests and a build, not against a live deployment.",
            "Rate limiting is in memory and per server instance.",
            "The database schema and row-level-security SQL are not in the repository (the migrations were removed from the main branch), so the policies could not be reviewed from the code.",
        ],
        tech: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Gemini", "Vitest"],
        next: [
            "Put the database schema and row-level-security SQL back in the repository so the policies can be reviewed.",
            "Replace the in-memory rate limiter with a shared store.",
            "Keep signing keys outside process memory.",
        ],
        repo: "Ujjwaljain16/CampusSync",
        links: [
            { label: "Live demo", href: "https://campusync1.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/CampusSync") },
        ],
    },
    {
        id: "vaulttabs",
        name: "VaultTabs",
        tier: "more",
        tagline: "Sync open browser tabs across devices. Snapshots are encrypted in the browser, but it is not zero-knowledge.",
        status: "prototype",
        origin: "Personal project",
        period: "Feb–Mar 2026 · 57 commits",
        problem: "Tab-sync tools usually upload your URLs to a server in plaintext, and the built-in browser sync is tied to one vendor.",
        approach: [
            "A browser extension (WXT, Chrome Manifest V3) captures open http(s) tabs, skips incognito tabs, and encrypts the list with a random AES-256-GCM master key before uploading.",
            "The master key is wrapped with a key derived from the account password (PBKDF2, 100,000 iterations) and optionally with a one-time recovery code. A Next.js PWA and other extensions unwrap it locally to view snapshots and send a tab to another device.",
            "A Fastify and PostgreSQL backend stores ciphertext and the wrapped keys.",
        ],
        evidence: [
            {
                text: "Snapshots are AES-256-GCM encrypted client-side with a fresh random 96-bit IV each, so a stolen database contains no readable tab data. A script checks this against the database.",
                source: "pwa/src/lib/crypto.ts",
            },
            {
                text: "A Sep 2026 review fixed real defects: restore requests could be read or completed by any logged-in user, JWTs never expired, CORS was open outside production, and the docker-compose healthchecks were malformed so the backend never started.",
                source: "backend/src/services/restore.service.ts",
            },
        ],
        limitations: [
            "Not zero-knowledge. The account password is sent to the server (over TLS) at sign-up and login, and the same password protects the master key, so a server operator who captures passwords can decrypt every snapshot. Fixing it needs an authentication redesign, such as a separate auth secret or OPAQUE.",
            "The server sees your email, device names, timestamps, snapshot sizes and restore target URLs.",
            "The first README and the app copy claimed zero-knowledge. They were corrected in Sep 2026.",
            "There is one integration test file. The Docker setup and the fixes above were type-checked and built but not run end to end.",
        ],
        tech: ["TypeScript", "WXT", "Next.js", "Fastify", "PostgreSQL", "WebCrypto", "Docker"],
        next: [
            "Stop sending the account password to the server, by using a separate authentication secret or OPAQUE.",
            "Use a stronger key-derivation function than PBKDF2 with 100,000 iterations, and encrypt restore target URLs.",
            "Run the Docker setup end to end against a real database.",
        ],
        repo: "Ujjwaljain16/VaultTabs",
        links: [
            { label: "Live demo", href: "https://vaulttabs.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/VaultTabs") },
        ],
    },
    {
        id: "ecommerce-backend",
        name: "E-commerce Backend",
        tier: "more",
        tagline: "Go microservices over gRPC: three of five planned services are built and tested.",
        status: "in-progress",
        origin: "Personal project",
        period: "Dec 2025 – Jan 2026 · 64 commits",
        problem: "Practise service boundaries, gRPC and per-service testing by building the pieces of an online store.",
        approach: [
            "Account (9 RPCs, bcrypt and JWT), catalog and order services, each with its own PostgreSQL schema and migrations.",
            "Each service exposes Prometheus metrics through a gRPC interceptor.",
        ],
        evidence: [
            { text: "About 109 test functions, including Testcontainers PostgreSQL integration tests, and CI that runs tests with the race detector." },
            {
                text: "The plan for the remaining services is written down.",
                source: "ROADMAP.md",
            },
        ],
        limitations: [
            "Payment, notification, the GraphQL gateway, Kafka, Redis, Elasticsearch and Kubernetes are planned, not built.",
            "The order service trusts client-supplied prices instead of checking the catalog.",
        ],
        tech: ["Go", "gRPC", "PostgreSQL", "Prometheus", "Docker", "Testcontainers"],
        repo: "Ujjwaljain16/E-commerce-Backend",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/E-commerce-Backend") }],
    },
    {
        id: "spentsmart",
        name: "SpentSmart",
        tier: "more",
        tagline: "A privacy-first Android UPI expense tracker with a custom Kotlin native module and no backend.",
        status: "shipped",
        origin: "Personal project",
        period: "Jan–Feb 2026 · 65 commits",
        problem: "Expense trackers usually read SMS or link bank accounts. Track UPI payments without either, and keep all data on the device.",
        approach: [
            "A Kotlin Expo module queries PackageManager for UPI apps and launches them by package, and shares QR images through a FileProvider.",
            "Data lives in local storage behind an optional biometric lock. A pending-payment flow watches deep links and the clipboard, and asks the user to confirm.",
        ],
        evidence: [
            { text: "Three APK releases (v1.0.0, v2.0.0, v2.01) on GitHub Releases." },
            { text: "Nine phone screenshots are in the repository README." },
        ],
        limitations: [
            "No automated tests.",
            "Payment \"verification\" is a time-based confidence heuristic, not real payment status.",
            "Android only.",
        ],
        tech: ["React Native", "Expo", "TypeScript", "Kotlin"],
        repo: "Ujjwaljain16/SpentSmart",
        links: [
            { label: "Releases (APK)", href: "https://github.com/Ujjwaljain16/SpentSmart/releases" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/SpentSmart") },
        ],
        gallery: {
            layout: "phone",
            items: [
                {
                    src: "/projects/spentsmart/demo-1.webp",
                    alt: "Analytics screen: this month's spending, income and expense totals, a category breakdown and weekly spending.",
                    width: 720,
                    height: 1600,
                },
                {
                    src: "/projects/spentsmart/demo7.webp",
                    alt: "Manual entry form for an expense or income with payment method and category.",
                    width: 720,
                    height: 1600,
                },
                {
                    src: "/projects/spentsmart/demo8.webp",
                    alt: "Manage categories screen with default categories and a reset option.",
                    width: 720,
                    height: 1600,
                },
                {
                    src: "/projects/spentsmart/demo-6.webp",
                    alt: "Settings: privacy dashboard, biometric lock, privacy mode that masks amounts, and a monthly budget limit.",
                    width: 720,
                    height: 1600,
                },
            ],
        },
    },
];

/** Smaller builds: one line each, no detail page. */
export const alsoBuilt: AlsoBuilt[] = [
    {
        name: "TypeAheadX",
        repo: "Ujjwaljain16/TypeAheadX",
        line: "Autocomplete service with a consistent-hash ring over three Redis nodes and decayed trending scores. Rebalancing from 3 to 4 nodes moved 26% of keys versus 75% for modulo hashing (from the repo's benchmark script). Course project.",
    },
    {
        name: "NevUpAI",
        repo: "Ujjwaljain16/NevUpAI",
        line: "Event-driven trade analytics backend (Fastify, PostgreSQL, Redis Streams). A k6 write test at 100 virtual users measured p95 of about 27.8 ms; its \"100% revenge-flag accuracy\" check compares seeded labels with themselves, so it is not an accuracy result. Hackathon build.",
    },
    {
        name: "HttpServer",
        repo: "Ujjwaljain16/HttpServer",
        line: "HTTP/1.1 server on raw sockets in Python: a bounded worker pool that returns 503 when saturated, per-IP rate limiting and a Prometheus endpoint. Student project.",
    },
];

export const featuredProjects = projects.filter((p) => p.tier === "flagship");
export const moreProjects = projects.filter((p) => p.tier === "more");

export function getProject(id: string): Project | undefined {
    return projects.find((p) => p.id === id);
}

export function sourceUrl(repo: string, path: string): string {
    return `https://github.com/${repo}/blob/HEAD/${path}`;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
    ongoing: "ONGOING",
    shipped: "SHIPPED",
    prototype: "PROTOTYPE",
    "in-progress": "IN PROGRESS",
};
