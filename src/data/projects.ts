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
        period: "Aug 2026 – Sep 2026",
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
        tagline: "A bookmark manager that recommends saved pages for the project you are building, with its retrieval quality and latency measured.",
        status: "ongoing",
        origin: "Personal project, ongoing",
        period: "Jul 2025 – present · 681 commits",
        problem:
            "Saved bookmarks and posts pile up across tabs and apps and can't be searched by meaning, and a project needs the few saved pages that help with it, not a list of everything loosely related.",
        approach: [
            "You create a project and tasks; the engine builds an intent from your own words and ranks saved pages by their best matching passage. Pages are split into overlapping chunks, embedded with bge-small (384 dimensions) and stored in PostgreSQL with pgvector, searched with HNSW indexes and diversified with MMR.",
            "RQ workers on Redis fetch and embed pages in the background; Gemini adds a content profile per page and refines the intent, in jobs that no request waits for. A small cross-encoder flags weak matches, which the page folds behind a toggle.",
            "A React frontend on Vercel, a Flask API in a Docker container on a free Hugging Face Space (gunicorn with gevent, workers under supervisord), Supabase Postgres, Upstash Redis and a Manifest V3 browser extension.",
        ],
        evidence: [
            {
                text: "On BEIR SciFact (300 queries, run through the production search code) passage retrieval scores nDCG@10 0.718. On a long-document variant it scores 0.504 against 0.016 for one embedding per document.",
                source: "docs/adr/ADR-007-intent-engine.md",
            },
            {
                text: "Live semantic-search latency on the deployed Space, 30 samples per endpoint: p50 3,026 ms down to about 1,700 ms (1,661 at the best run, -45%) and SQL statements per search from about 10 to 1, with each run recorded and the unexplained remainder written down.",
                source: "docs/perf/README.md",
            },
            {
                text: "A cross-encoder rerank was measured and left off for search: it moved nDCG@10 by -0.008 and +0.004 for about 700 ms a query. It is used only to flag weak matches.",
                source: "docs/adr/ADR-007-intent-engine.md",
            },
            {
                text: "The free Redis plan's 500,000 monthly commands ran out. Removing the scheduler and per-bookmark polling brought an idle 10-minute sample to 2 commands.",
                source: "docs/OPERATIONS.md",
            },
            {
                text: "The passage table has an HNSW index (m=16, ef_construction=64) created in an Alembic migration.",
                source: "backend/alembic/versions/0011_content_chunks.py",
            },
            {
                text: "Backend CI, Frontend CI, a Docker build check and the Space sync all pass on the latest commit (5e47109).",
            },
        ],
        limitations: [
            "Throughput under load is not measured on the live Space: its benchmark is 30 samples per endpoint from one machine in India. Recommendation quality is measured offline, not on real users' feedback.",
            "About 900 ms of each semantic search is unexplained. Postgres runs the statement in about 2 ms, yet a trivial query from the Space to the database (Supabase, Singapore) costs 213-228 ms. Moving the database closer is written up and deferred; the Space's own region is not documented.",
            "SciFact is scientific abstracts, not bookmarks, so no benchmark on real saved pages exists. The weak-match floor was calibrated on one 238-bookmark library over 15 requests, 23% of useful results were also flagged, and the repository does not record who assigned the relevance labels.",
            "The browser extension has not been exercised end to end in real Chrome against the deployed backend.",
            "The earlier two-stage recommendation pipeline, its shadow mode and the golden-set regression gate were deleted on 12 Oct 2026, and the decision records about them carry a note saying so.",
            "Built with an AI coding assistant: 11 of the 681 commits carry a Claude co-author trailer, all from before 12 Oct 2026, so that count understates it.",
        ],
        tech: ["Python", "Flask", "PostgreSQL", "pgvector", "Redis", "RQ", "SentenceTransformers", "Gemini", "React", "Vite", "Alembic", "GitHub Actions"],
        next: [
            "Move the database closer to the Space, then re-run the live benchmark to see how much of the unexplained 900 ms was distance.",
            "Record who assigned the weak-match relevance labels, and re-check them with independent raters before quoting the figures as a benchmark.",
            "Add a retrieval benchmark on real saved pages, since SciFact only stands in for them.",
        ],
        repo: "Ujjwaljain16/Fuze",
        links: [
            { label: "Source on GitHub", href: gh("Ujjwaljain16/Fuze") },
            { label: "Live app", href: "https://itsfuze.vercel.app" },
        ],
    },
    {
        id: "sse-observatory",
        name: "SSE-Observatory",
        tier: "more",
        tagline: "A browser-based debugger for Server-Sent Events: query language, replay, and multi-tab stream sharing.",
        status: "prototype",
        origin: "Personal project",
        period: "Feb 2026 – Mar 2026",
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
        period: "Aug 2026 – Sep 2026 · 226 commits on 5 days",
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
        tagline: "Duplicate GitHub issue detection over signed webhooks and pgvector search. In progress: two of four planned stages are built.",
        status: "in-progress",
        origin: "Personal project",
        period: "Mar 2026 · two days of work so far",
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
            "Not complete. Ingestion and duplicate detection (weeks 1-2) are built and are what the evidence below covers. The evaluation set is tiny (20 labels), so precision or recall are not quoted.",
            "The repo also has code for an issue graph and cross-system sync (app/graph, app/sync) from a later, unfinished stage. It has not been evaluated, so it is not described here.",
            "No CI and not deployed.",
        ],
        next: [
            "Finish and evaluate the issue-graph and cross-system sync stages, or drop the unfinished code.",
            "Grow the evaluation set past 20 labels before quoting precision or recall.",
            "Add CI.",
        ],
        tech: ["Python", "FastAPI", "Redis Streams", "PostgreSQL", "pgvector", "sentence-transformers", "Docker"],
        repo: "Ujjwaljain16/GitIssue",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/GitIssue") }],
    },
    {
        id: "typeaheadx",
        name: "TypeAheadX",
        tier: "more",
        tagline: "Distributed autocomplete over three Redis nodes, hardened by breaking it: node loss, a frozen database and concurrent writes, each measured before and after.",
        status: "prototype",
        origin: "Course project (the original app), audited and hardened afterwards",
        period: "Jun 2026 – Oct 2026 · 15 original commits over two days, then an audit",
        problem: "Autocomplete is read-heavy but latency-sensitive: one search generates a query per keystroke, hot prefixes create Zipfian skew, and a single Redis instance becomes a bottleneck.",
        approach: [
            "FastAPI serves suggestions from PostgreSQL behind a Redis cache-aside layer; a 128-bit MD5 consistent-hash ring (500 virtual nodes) spreads prefixes across three Redis nodes. A Next.js frontend calls the API directly.",
            "Writes are batched in memory and flushed as one atomic SQL statement; a decaying trending score is applied when results are read, not when they are stored.",
            "Failure handling was written after trying to break each claim at runtime: a per-node circuit breaker with no client retries for Redis, a deadline, bulkhead and breaker for database reads, a bounded write buffer, and single-flight for concurrent identical misses.",
        ],
        evidence: [
            { text: "The consistent-hash ring balances keys evenly (about 33.9/34.6/31.6% at 500 virtual nodes; 1,000 is tighter, and 150 gives 39.7/28.6/31.7%). Adding a fourth node moves about 26.4% of keys against about 74.8% under modulo hashing.", source: "benchmarks/results/experiments/claims.json" },
            { text: "Stopping or freezing one of three Redis nodes at 100 requests per second caused 36-38% errors and about 17 s without a successful request. The cause included redis-py's default retries (a 250 ms timeout took 7.65 s). With a per-node circuit breaker and retries off: 0 errors, p99 about 9 ms, in repeated runs.", source: "docs/adrs/004-cache-failure-handling.md" },
            { text: "Six concurrent flushers lost 67.5% and 70.0% of the counter updates (234 and 216 of 720 stored) until the merge moved into one SQL statement: 720 of 720, and a flush of 100 queries from about 500 ms to about 14 ms.", source: "benchmarks/results/experiments/lost_update.jsonl" },
            { text: "A 20 s database freeze left 14 s with no successful request. A read deadline, bulkhead and breaker cut that to 0 s, with the slowest request at 2.0 s. Writes are deliberately not guarded, because a timed-out write may still execute.", source: "docs/adrs/006-write-path-durability-and-db-deadlines.md" },
            { text: "The audit also found that cache invalidation never invalidated (two different key strings), that the trending rank was ignored by the SQL, that LIKE wildcards in the search box changed the meaning of a query, and that one oversized query dropped a whole batch. Each has a regression test.", source: "docs/postmortems.md" },
            { text: "136 backend tests (71 need no services, 65 run against real PostgreSQL and Redis), 11 frontend tests, a 17-defect mutation check that the suite catches, and CI on every pull request.", source: "benchmarks/mutation_smoke.py" },
            { text: "An open-loop, interleaved benchmark replaced a closed-loop one. On a free GitHub-hosted Linux runner the original code collapsed at 500 requests per second with one worker, while the current code served 900 and, with two workers, 1,500 with no errors.", source: "docs/benchmarks.md" },
        ],
        limitations: [
            "A prototype, not a production service: no real users or traffic. The main results come from one Windows laptop with one uvicorn worker, a 150,000-row sample of a public autocomplete dataset, and synthetic keystroke traffic; the Linux CI run is on a shared, noisy runner.",
            "There is no authentication or rate limiting on POST /search, so anyone can inject suggestions; that needs a gateway or a product decision. Debug endpoints are on by default, and an unknown cache provider silently falls back to an unbounded in-memory cache.",
            "Writes still block while the database is frozen, and the write buffer lives in process memory, so a crash loses up to about 10 s of popularity counters. The breaker and single-flight are per process.",
            "Balanced keys did not mean balanced traffic: under a Zipfian workload one node still took about 60% of requests, because the most popular queries hash to it. That is a property of the workload, and the proposed fix (an L1 cache or hot-key replication) is not built.",
            "A warm cache hit has a p50 of about 1.1-1.5 ms in the open-loop laptop runs, not the 'sub-millisecond' the original README claimed, and the 97-98% hit rate in the original report came from 10,000 synthetic keys, which cap even a cold cache's hit rate at about 95.6%.",
            "Not measured: more than two workers, a separate load-generator host, a million-row corpus, a soak longer than two minutes, real network latency or TLS. Fault injection runs locally, not in CI, there are no browser end-to-end tests, and the full 240-point matrix ran an earlier build (two later changes were validated in isolation).",
            "The trending parameters are the documented defaults and have not been tuned on real traffic.",
        ],
        tech: ["Python", "FastAPI", "PostgreSQL", "Redis", "Next.js", "TypeScript", "GitHub Actions"],
        next: [
            "Add authentication or rate limiting to POST /search.",
            "Build the proposed hot-key fix (an L1 cache or hot-key replication) and re-measure the 60% hot-node share.",
            "Run fault injection in CI and measure beyond two workers on a separate load-generator host.",
            "Give writes an idempotency key so they can have a deadline too.",
        ],
        repo: "Ujjwaljain16/TypeAheadX",
        links: [
            { label: "Source on GitHub", href: "https://github.com/Ujjwaljain16/TypeAheadX" },
            { label: "Post-mortems", href: "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/docs/postmortems.md" },
            { label: "Benchmarks", href: "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/docs/benchmarks.md" },
        ],
    },
    {
        id: "agentbrake",
        name: "AgentBrake",
        tier: "more",
        tagline: "A stdio proxy that intercepts an AI agent's MCP tool calls and enforces policies before they run.",
        status: "shipped",
        origin: "Personal project, one-day build",
        period: "Feb 2026 – Sep 2026 · fail-closed fixes in Sep",
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
        period: "Nov 2025 – Dec 2025",
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
        tier: "flagship",
        tagline: "Multi-tenant certificate verification for universities and recruiters, rebuilt after a security audit.",
        status: "prototype",
        origin: "Personal project",
        period: "Sep 2025 – Oct 2026 · 234 commits",
        problem: "Certificates are checked by hand and are easy to forge, so recruiters can't trust the ones they receive.",
        approach: [
            "Students upload certificates; Gemini vision extracts the fields and regular expressions normalise them; faculty approve.",
            "Approved certificates are issued as signed credentials (RS256 JWS in a W3C-VC-shaped JSON, with a did:web identifier) with revocation and public verification. One verifyCredential() service answers every public endpoint and fails closed.",
            "Roles live in one table (user_roles), credentials and the audit log are written only by the backend, and schema changes ship as staged migrations applied by a gated runner and replayed on PostgreSQL 17 in CI.",
        ],
        evidence: [
            { text: "100 API route files. A test fails the build when a route is neither guarded nor on an explicit public list.", source: "tests/security/route-inventory.test.ts" },
            { text: "80 test files and 1,432 passing tests, run on main on 16 Oct 2026. They use in-memory fakes for the database." },
            {
                text: "A review of commit 91d0c77 (static reading plus targeted tests; not a penetration test and no outside reviewer) tracked 19 findings, 5 of them P1, in a public closure report. 17 are fixed in code and deployed with regression tests, one is partly fixed, and one needs an owner action outside the code. The P1s: every public credential verification failed, revocation was enforced on one path only, reviewers could approve their own certificates, and an admin of one organization could act on another.",
                source: "my-app/docs/AUDIT-CLOSURE.md",
            },
            {
                text: "Credential lookup went from 1,172 ms to 0.207 ms (6 to 37,280 queries per second at about 280,000 credentials) by replacing a JSON scan with an indexed column. PostgreSQL 17, median of 3 rounds on a GitHub Actions runner, synthetic data, database time only. The production pending-list query is about 9 percent slower, and an insert speed-up from an earlier run did not reproduce and was withdrawn in writing.",
                source: "my-app/docs/BENCHMARKS.md",
            },
            {
                text: "After the fixes: HttpOnly server-managed sessions, certificate files served by 5-minute signed URLs from a now-private bucket (an old public URL went from HTTP 200 to blocked), and a PostgreSQL-backed global rate limiter on the high-value endpoints (30 requests allowed, then 429 with Retry-After on the live site).",
                source: "my-app/docs/AUDIT-CLOSURE.md",
            },
            {
                text: "An earlier Sep 2026 review of every route had already found and fixed real holes: role assignment and signup that did not require a session, credential issuing for arbitrary claims, unauthenticated document-status routes that used the service role, unsigned webhooks and open redirects. Dependency audit findings went from 71 to 2.",
                source: "my-app/src/lib/safeRedirect.ts",
            },
        ],
        limitations: [
            "Credentials are W3C-style (JWS, did:web), not a conformance-tested Verifiable Credentials implementation. The revocation status list, the transparency log and SD-JWT selective disclosure are implemented and unit-tested but switched off in production. Nothing here is zero-knowledge.",
            "About 50 server files use the service-role client, which bypasses row-level security, so on those routes tenant isolation rests on the application checks alone. A stricter profiles policy migration is deliberately on hold.",
            "There are no browser end-to-end tests, and a full live pass of the login, upload, review and recruiter flows is not finished. The migrations are tested against a model of the production schema, not against production itself, and the original baseline schema is still not in the repository.",
            "Rate limiting is global only on the endpoints listed in the repository's rate-limiting document; the rest is per instance. There is no tracing, metrics or dashboards, only an optional alert webhook and a deep health check.",
            "The recruiter and organization-admin invitation flow is incomplete: invited users stay pending. The Next.js major-version upgrade is pending.",
            "The early version was much less secure than its README suggested; the public closure report says which claims were corrected.",
        ],
        tech: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Gemini", "Vitest", "GitHub Actions"],
        next: [
            "Add browser end-to-end tests and finish the live pass of the login, upload, review and recruiter flows.",
            "Move the remaining endpoints onto the global rate limiter.",
            "Finish the invitation flow so invited users can be activated.",
            "Take the stricter profiles row-level-security migration off hold once the service-role routes are narrowed.",
        ],
        repo: "Ujjwaljain16/CampusSync",
        links: [
            { label: "Live demo", href: "https://campusync1.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/CampusSync") },
            { label: "Audit closure report", href: gh("Ujjwaljain16/CampusSync/blob/HEAD/my-app/docs/AUDIT-CLOSURE.md") },
        ],
    },
    {
        id: "campusslot",
        name: "CampusSlot",
        tier: "flagship",
        tagline: "A campus room-booking service built to show the delivery side: measured rollouts, a measured rollback, and query costs at scale.",
        status: "prototype",
        origin: "Personal project",
        period: "Oct 2026 · 92 commits",
        problem: "A small booking service is easy to make work once. This project shows what happens when it is deployed, changed, broken and grown, with numbers instead of claims.",
        approach: [
            "FastAPI, React and PostgreSQL. The rule that two confirmed bookings never overlap is enforced in request validation, in an application check and by a PostgreSQL exclusion constraint on a time range.",
            "Delivery: GitHub Actions gates (tests, secret scan, Trivy on the images, the Terraform and the Helm chart), signed image attestations verified before deploy, a deploy job that installs the chart into a throw-away kind cluster and smoke-tests it through the ingress, Argo CD, Prometheus, Loki and Grafana on a local Minikube cluster, and Terraform for a VPC and EKS cluster that was applied once and destroyed.",
            "Each claim in the README has a measurement behind it in docs/engineering and raw output in docs/evidence, and numbers that did not reproduce were withdrawn in writing.",
        ],
        evidence: [
            { text: "A concurrent-write test on real PostgreSQL creates exactly one booking when identical requests arrive together; separate tests show the database rejects overlaps even when the application check is bypassed.", source: "backend/tests/test_postgres.py" },
            { text: "At 200,000 bookings the overlap query read 2,469 pages; a range operator with a GiST index reads 30, and the all-rooms day view went from 21 to 113 requests per second. Synthetic data, one laptop.", source: "docs/engineering/data-scale.md" },
            { text: "Rolling updates lost requests (7 of 2,500) until an 8-second preStop delay was added (0 of 1,800 in three runs). A deliberately broken release rolled back by itself at 62 s with 0 of 4,800 user requests failing across three runs, and a control without --atomic showed what the rollback adds.", source: "docs/engineering/bad-release-drill.md" },
            { text: "A database outage returned 500s that Prometheus did not count; the backend now answers 503 and the metric counts them, and an alert drill fired after 185 s.", source: "docs/engineering/resilience.md" },
            { text: "Median pipeline time fell from 238 s to 148 s (three runs after the change) by running independent jobs in parallel and skipping the heavy jobs for documentation-only changes.", source: "docs/engineering/ci-speed.md" },
            { text: "The Terraform for a 48-resource VPC and EKS cluster failed on first apply, was diagnosed and fixed, and was destroyed about 45 minutes after creation for roughly 6 US cents; an all-region check found nothing left running.", source: "docs/evidence/terraform-destroy.txt" },
            { text: "14 architecture decision records on main, each listing the options that were rejected, and 26 merged pull requests.", source: "docs/adr/README.md" },
        ],
        limitations: [
            "No real users and no production traffic: it is a demonstration system, not a production one. The cluster ran on one laptop (Minikube) and in CI (kind); every performance and resilience number comes from one machine, small samples, and runs that differ by up to 18 percent.",
            "The application was never deployed to EKS: the cluster carried no workload. Argo CD, Loki and Alloy ran only on the local cluster.",
            "The application has no login or roles on purpose, and the chart defines no network policies.",
            "There is no Alertmanager, so alerts are visible in Prometheus but not delivered anywhere, and nobody is told when an automatic rollback happens. Promotion to the cluster is manual.",
            "The database backup lives in the same cluster, so it covers mistakes and a lost volume but not the loss of the cluster, and it is a snapshot, not point-in-time recovery.",
            "The presentation was delivered as a deck and a recorded demo (captions, no audio); no live presentation was given.",
        ],
        tech: ["FastAPI", "React", "PostgreSQL", "Docker", "Kubernetes", "Helm", "Argo CD", "Terraform", "Prometheus", "GitHub Actions"],
        next: [
            "Add Alertmanager so alerts and automatic rollbacks reach a person.",
            "Copy backups off the cluster, or move to a managed database with point-in-time recovery.",
            "Add an idempotency key to booking creation so a client retry cannot book twice.",
            "Enforce the image-attestation check inside the cluster with an admission policy.",
        ],
        repo: "Ujjwaljain16/campusslot",
        links: [
            { label: "Source on GitHub", href: gh("Ujjwaljain16/campusslot") },
            { label: "Recorded demo", href: gh("Ujjwaljain16/campusslot/blob/HEAD/docs/demo/CampusSlot-demo.mp4") },
            { label: "Blog post: the overlap-query investigation", href: "https://medium.com/@jainujjwal1609/why-postgresql-ignored-my-gist-index-until-i-rewrote-the-overlap-query-feb971225225" },
        ],
    },
    {
        id: "vaulttabs",
        name: "VaultTabs",
        tier: "more",
        tagline: "Sync open browser tabs across devices. Snapshots are encrypted in the browser, but it is not zero-knowledge.",
        status: "prototype",
        origin: "Personal project",
        period: "Feb 2026 – Mar 2026 · 57 commits",
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
        period: "Jan 2026 – Feb 2026 · 65 commits",
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
        name: "Lexis AI",
        repo: "Ujjwaljain16/GenAI-34",
        line: "Adaptive learning platform: turns a PDF into a concept graph and a personalised study plan, with Neo4j holding the graph projection. About 78% of the commits are mine; teammates built the spaced-repetition engine and the evaluation harness. Team project (4 contributors).",
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

// The featured grid shows the three "start here" projects first (see src/data/startHere.ts), then the rest.
const FEATURED_ORDER = ["fuze", "campussync", "campusslot", "recoveryos", "flashflow", "minidb"];
const featuredRank = (id: string) => {
    const i = FEATURED_ORDER.indexOf(id);
    return i === -1 ? FEATURED_ORDER.length : i;
};
export const featuredProjects = projects.filter((p) => p.tier === "flagship").sort((a, b) => featuredRank(a.id) - featuredRank(b.id));
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
