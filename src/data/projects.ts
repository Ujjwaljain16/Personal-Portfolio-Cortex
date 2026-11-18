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

/**
 * What kind of work a project is, for the filter on /projects. One or two per project, the main one first. They are
 * the author's own classification, not something measured.
 */
export type ProjectArea = "ai" | "backend" | "infra-devops" | "internals" | "security" | "full-stack" | "tools" | "mobile";

/** Every area in the order the filter shows them, with its label. */
export const AREAS: { id: ProjectArea; label: string }[] = [
    { id: "ai", label: "AI" },
    { id: "backend", label: "Backend" },
    { id: "infra-devops", label: "Infra & DevOps" },
    { id: "internals", label: "Internals" },
    { id: "security", label: "Security" },
    { id: "full-stack", label: "Full-stack" },
    { id: "tools", label: "Tools" },
    { id: "mobile", label: "Mobile" },
];

export const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.id, a.label])) as Record<ProjectArea, string>;

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
    /** One or two areas, the main one first (see ProjectArea). */
    areas: ProjectArea[];
    /** `owner/name` on GitHub. */
    repo: string;
    links: ProjectLink[];
    /** Screenshots copied from the project's own repository. */
    gallery?: Gallery;
    /**
     * A short screen recording of the running app, served from public/. The caption says how it was edited
     * (what was cut, what was sped up), so the clip is never faster than the real thing without saying so.
     */
    demo?: { mp4: string; webm?: string; poster: string; caption: string };
    /**
     * One number for the project card, copied from this project's evidence or records, with the context that keeps it
     * honest (what was measured, and against what). A miss is as good a headline as a win.
     */
    headline?: { value: string; label: string };
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

/** SSE-Observatory v2.0.0: the commit main points at since the release on 15 Nov 2026 (merge of PR #68). Evidence is pinned to it. */
const SSE_RELEASE = "7519e4852fe8ccc90c75daeb2625ce5436fdf324";

/** AgentBrake v4: the commit on main since 17 Nov 2026. Its new files are pinned to it. */
const AGENTBRAKE_V4 = "28071e182080c4123f664fc1420fbb2124a650dc";

/** AgentBrake as published to npm as 2.0.0 (17 Nov 2026): the commit its package was built from. */
const AGENTBRAKE_PUBLISHED = "a6fc101d833ef6786d51c6f5be6cecdc8a4a8ae2";

/** VaultTabs v1.0.5 (16 Nov 2026), the commit its latest release points at. Evidence is pinned to it. */
const VAULTTABS_V105 = "3c90ce21d7b89deaa76d3a842c176646b26c2ca0";

/** Warrant v0.2.0 (16 Nov 2026), "the current final state": the commit main points at. Evidence is pinned to it. */
const WARRANT_020 = "f50f4165fdd48c22b02ea61585850ffdffbaa0bf";

export const projects: Project[] = [
    // ─── Flagship ──────────────────────────────────────────────────────────
    {
        id: "recoveryos",
        name: "RecoveryOS",
        tier: "more",
        tagline: "Recovers failed payments: an LLM may recommend, but only a deterministic policy engine may act.",
        status: "prototype",
        headline: { value: "₹73,182", label: "mean recovered revenue per simulated 10,000-payment run, 5 seeds (95% CI \u20b952,919 to \u20b993,445)" },
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
        areas: ["ai"],
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
        id: "warrant",
        name: "Warrant",
        tier: "flagship",
        tagline: "Evidence-gated execution for AI agents: a task counts as done only when the host has checked it, with a hash-chained log, a fault-injection benchmark and a study of real models' \"done\" claims.",
        status: "shipped",
        origin: "Personal project",
        period: "Oct 2026 – Nov 2026 · v0.2.0 on 16 Nov 2026",
        problem:
            "When an agent, a script or a tool-using model reports \"done\", most orchestrators believe it. Under crashes mid-effect, hung tools, duplicate delivery, cancellation and models that are simply wrong, that report is not evidence.",
        approach: [
            "A spec is a DAG of tasks. The engine dispatches each to a worker (a subprocess, a model-driven agent or a command-line coding agent), treats what comes back as untrusted, and marks a task succeeded only after a host-side gate has checked the output against requirements the spec author wrote. A requirement it cannot evaluate gives an unknown verdict that names what went unverified.",
            "Workers run with deadlines, bounded classified retries and deduplicated delivery. Cancellation aborts in-flight work, and an irreversible effect is reconciled, never retried on a guess.",
            "Every state change goes into a hash-chained, crash-recoverable log. resume continues after a crash, verify-log re-audits a finished log without the engine, and an Ed25519 signature over the head catches a log rewritten with every hash recomputed.",
            "For coding agents, hidden tests the model never sees run in a split-container Docker sandbox. A small MCP server lets a model run human-approved specs by name, and nothing else.",
            "Two ways to doubt it: a deterministic fault-injection benchmark (5 policies × 10 fault profiles × 5 workloads, bootstrap confidence intervals) and a study of real models whose claims were checked by hidden tests.",
        ],
        evidence: [
            {
                text: "Simulated benchmark, 125,000 runs on held-out seeds with 500 paired trials per cell, against the closest baseline (same deadlines and retries, no gate, no deduplication): when workers falsely claim success, wrong results reported as success fall from 44.2% to 0%; under mixed faults, duplicate non-repeatable effects fall from 19.0% to 0%.",
                source: `docs/BENCHMARK.md@${WARRANT_020}`,
            },
            {
                text: "Where it loses, measured in the same benchmark: +49 ms of simulated latency with no faults at all, and 13.5 points fewer tasks completed when non-repeatable work cannot be reconciled, because it refuses to guess.",
                source: `docs/BENCHMARK.md@${WARRANT_020}`,
            },
            {
                text: "Real models, 180 episodes on 30 held-out tasks: the agents claimed \"done\" 136 times and 77 of those claims were wrong (56.6%, 95% CI 44.3% to 68.1%). Of the 77, trusting the claim accepts all, the agent's own visible tests accept 56 (72.7%), and Warrant's hidden-test gate accepts 3 (3.9%, CI 0.0% to 10.1%).",
                source: `docs/AGENT_RESULTS.md@${WARRANT_020}`,
            },
            {
                text: "A separate arm with Claude Haiku 5.5 served by Anthropic through Claude Code made 0 wrong claims in 30 on the same tasks and gate, against 32 of 85 for the router's model of the same name. The harness differs, so the two are reported side by side, not compared.",
                source: `docs/AGENT_CLAIMS_CLAUDE_ARM.md@${WARRANT_020}`,
            },
            {
                text: "A chaos test crashes the engine at every log boundary and checks that resume recovers a consistent run.",
                source: `test/resume.test.js@${WARRANT_020}`,
            },
            {
                text: "A forged log, with one failed gate verdict flipped to a pass and every later hash recomputed, still passes the hash chain but is rejected by the signature check.",
                source: `test/signing.test.js@${WARRANT_020}`,
            },
            {
                text: "453 tests at v0.2.0 (commit f50f416), run on Windows with Node 22 on 17 Nov 2026: 406 pass, 0 fail, 47 skipped (the ones that need Docker or a network). CI passes on ubuntu-latest and windows-latest.",
            },
            {
                text: "The project's own audit reports 94.4% line and 90.3% branch coverage, and 13 of 13 hand-written mutants of the engine, scheduler and gate caught by the fast suite.",
                source: `docs/FINAL_AUDIT.md@${WARRANT_020}`,
            },
            {
                text: "Zero npm dependencies: signing uses node:crypto and the tests use node:test.",
                source: `package.json@${WARRANT_020}`,
            },
        ],
        limitations: [
            "The benchmark's workers are simulated and its fault rates are assumptions.",
            "The real-model study is small and synthetic: 30 short JavaScript tasks in one setting. The models were reached through a third-party router whose model identity is unverified, and the pre-registered primary arm (direct Gemini API) was only partly run because the free tier was overloaded.",
            "The wrong-claim rate depends heavily on the model: a partial direct Gemini run had 2 wrong in 36, against 37.6% and 88.2% for the two router models. The 57% describes that pair, not agents in general.",
            "The gate's misses could be 3 to 6 rather than 3, because one audit test is timing-sensitive. The LLM-judge comparison is inconclusive (142 of 402 judge replies were cut off).",
            "The gate is only as strong as the requirements written for it; with only a shape check, it stops nothing well-formed.",
            "Command workers are not sandboxed and run as the user. Only model-written code in the agent study runs in Docker.",
            "No macOS run, and the MCP server was not tested against a live Claude Code session.",
            "Gate v2 (an independently written second suite to measure how much of the gate's accuracy comes from its author) is not started.",
            "Commit dates in the repository were set after the fact and are not a development timeline; the tool-written timestamps in run metadata are the ones to trust.",
            "A small subset of Citadel (MIT) is vendored unmodified for the canonical-JSON digest and the journal design the log was rewritten from; the repository's provenance file lists what was taken.",
        ],
        tech: ["Node.js", "JavaScript", "Docker", "MCP", "Ed25519", "node:test"],
        areas: ["ai", "tools"],
        next: [
            "Write gate v2: a second, independently written hidden-test suite, re-scored over every recorded solution.",
            "Finish the pre-registered direct-API arm, so the headline rate no longer rests on an unverified router.",
        ],
        repo: "Ujjwaljain16/Warrant",
        links: [{ label: "Source on GitHub", href: gh("Ujjwaljain16/Warrant") }],
        gallery: {
            layout: "wide",
            items: [
                {
                    src: "/projects/warrant/lying-worker-dark.webp",
                    alt: "Warrant's run viewer on a lying-worker log: the hash chain verifies, the gate caught four false claims, and one task ran out of attempts so the tasks after it never started.",
                    width: 1600,
                    height: 1342,
                },
                {
                    src: "/projects/warrant/tampered-dark.webp",
                    alt: "The run viewer on the same log with one gate verdict edited from fail to pass: the hash chain breaks at entry 8, and everything after it is marked untrusted.",
                    width: 1600,
                    height: 1342,
                },
            ],
        },
        headline: {
            value: "100% → 3.9%",
            label: "of 77 wrong \"done\" claims from real models accepted: trusting the agent vs Warrant's hidden-test gate",
        },
    },
    {
        id: "minidb",
        name: "MiniDB",
        tier: "flagship",
        tagline: "A relational database built from scratch: B+ tree, buffer pool, SQL, optimizer, locking and crash recovery.",
        status: "prototype",
        headline: { value: "1.2–2.2×", label: "vectorized over Volcano execution, against the 10\u00d7 I aimed for" },
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
        areas: ["internals"],
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
        demo: {
            mp4: "/projects/fuze/demo.mp4",
            webm: "/projects/fuze/demo.webm",
            poster: "/projects/fuze/demo-poster.jpg",
            caption:
                "Recorded on the live app on 17 Nov 2026 with my own library. Cut from 3.5 minutes to 44 seconds; the waits for search and recommendations are sped up 3×.",
        },
        name: "Fuze",
        tier: "flagship",
        tagline: "A bookmark manager that recommends saved pages for the project you are building, with its retrieval quality and latency measured.",
        status: "ongoing",
        headline: { value: "3,026 → 1,661 ms", label: "median semantic search on the live app, by cutting about ten database round trips per search to one" },
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
        areas: ["ai", "full-stack"],
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
        tier: "flagship",
        tagline:
            "A browser and command-line tool that says why a Server-Sent Events stream is stuck, late or losing events, shows the evidence, and turns the diagnosis into a regression test.",
        status: "shipped",
        origin: "Personal project",
        period: "Feb 2026 – present · v1.0.0 tagged 20 Oct 2026, v2.0.0 released 15 Nov 2026",
        problem:
            "Browser devtools show SSE frames but not why a stream stalled, arrived in bursts, skipped ids or reconnected badly. A bug seen once is also hard to share, because the capture holds secrets, and hard to keep fixed.",
        approach: [
            "The viewer (v1): a fetch-based SSE client that resumes with Last-Event-ID and backs off with jitter, a query language compiled to closures, interceptors run in a worker with a 100 ms timeout, and one upstream connection per stream shared across tabs by a SharedWorker.",
            "The Stream Doctor (v2): fifteen diagnostic rules over what the client observed. Every finding keeps facts, each with pointers to the records that show it, apart from a \"Likely:\" deduction with its alternatives, and a check that could not run is reported as \"not evaluated\", never as healthy.",
            "A capture format with redaction, shareable reports, curl export, and scenario files generated from a capture. A failure lab of 23 captures, each with the findings it must and must not raise.",
            "sse-doctor, a command-line tool with probe, analyze, report, compare, env-diff, validate, repro, test, replay and selftest, and exit codes that CI can act on. validate answers \"did the fix work?\" and says \"inconclusive\" rather than \"fixed\" when it cannot tell.",
            "A proxy that is closed by default in production: same-origin check, an SSRF guard that checks every DNS answer and pins the connection to the address it validated, no redirects, and caps on bytes, time and concurrency.",
        ],
        evidence: [
            {
                text: "v2 was built on a long-lived branch from 21 Oct 2026 and released on 15 Nov 2026: pull request #68 merged it to main, the tag v2.0.0 and a GitHub release were published, and the hosted demo serves it.",
            },
            {
                text: "The command-line tool is on npm as sse-doctor: 2.0.0 on 15 Nov 2026 and 2.0.1 on 16 Nov 2026, both built from commits that are now on main. They were published by hand, so unlike AgentBrake's releases they carry no provenance attestation.",
            },
            {
                text: "Fifteen rules, a coverage list that says what could not be evaluated, and the rule that facts and deductions are never mixed.",
                source: `docs/technical/diagnostics.md@${SSE_RELEASE}`,
            },
            {
                text: "Every command and its exit codes (0 passed, 1 finding, 2 usage, 3 could not run, 4 inconclusive), including how validate decides.",
                source: `docs/guide/cli.md@${SSE_RELEASE}`,
            },
            {
                text: "A performance bug in the Doctor was found by profiling and fixed: under a 20,000-event burst the page's timer lateness (p95) fell from about 600 ms to 31 ms. The README states that its target of under 2% CPU at 500 events/s is not demonstrated, and a re-run on 15 Nov did not reproduce its October table exactly (see the records).",
                source: `README.md@${SSE_RELEASE}`,
            },
            {
                text: "The proxy rewrite that closed the open relay: closed by default, SSRF guard with DNS answers checked and the connection pinned, caps on bytes, time and concurrency.",
                source: `lib/proxy/guard.js@${SSE_RELEASE}`,
            },
            {
                text: "Tests for the guard's private-address cases, frame integrity, caps and disconnects.",
                source: `src/tests/proxyGuard.test.ts@${SSE_RELEASE}`,
            },
            {
                text: "CI runs lint, typecheck, tests and the build on Ubuntu and Windows, a dependency audit, a Docker build and start, and Playwright on Chromium with a separate Firefox and WebKit job.",
                source: `.github/workflows/ci.yml@${SSE_RELEASE}`,
            },
            {
                text: "A written testing campaign built on independent oracles (the WHATWG parsing algorithm written out literally, the fixture server's own log, a strict XML parser, the specification's own examples), the built command line run as a real process, and tables that pin every threshold at its edge. Its table lists 21 defects, each with the commit that fixed it, and it also lists what is still open and what was not covered.",
                source: `docs/technical/testing-campaign.md@${SSE_RELEASE}`,
            },
            {
                text: "The release report in that document: 2,402 tests passed and 30 are skipped (they run only in the nightly and release-candidate workflows), with 84.4% statement and 72.8% branch coverage in CI on Node 20; 176 of 176 browser tests on an idle machine; the built command line passes 35 build checks and 36 contract checks; 0 runtime dependency vulnerabilities at high severity or above.",
                source: `docs/technical/testing-campaign.md@${SSE_RELEASE}`,
            },
        ],
        limitations: [
            "The hosted demo runs v2.0.0 with its mock API switched off in production and its proxy closed by default, so it cannot be pointed at arbitrary hosts.",
            "The Doctor's CPU cost target (under 2% at 500 events/s) is not demonstrated: the main thread is busy 70 to 98% of the time in every measured variant, and the benchmark leaves out the SharedWorker's own work.",
            "It judges one stream from one browser's point of view: it can say that bytes stopped, not which layer stopped them. Gaps and duplicates are judged only for a sequence the profile declares.",
            "Not tested: real screen readers, Safari or mobile, or a real CDN or reverse proxy. A 10-minute soak at 200 events per second passed, but it is a smoke test: the gate that needs a forced garbage collection before each memory sample was not evaluated.",
            "Known flakiness, not fixed: one browser test with a stalled, a healthy and a dropping lane failed in some CI runs and passed on re-run.",
            "The newest 1,000 events live in memory and up to 100,000 in IndexedDB. The Doctor's own recording is bounded per stream.",
        ],
        tech: ["TypeScript", "React", "Vite", "Web Workers", "SharedWorker", "IndexedDB", "Express", "Node.js CLI", "Vitest", "fast-check", "Playwright"],
        areas: ["tools"],
        next: [
            "Decide whether and when to publish sse-doctor to npm.",
            "Finish what the campaign left open: the full paired benchmark harness and the heap-slope soak gate were not run, and real v1 recordings are still missing.",
            "Demonstrate the under-2%-CPU target end to end, or retire it.",
        ],
        repo: "Ujjwaljain16/SSE-Observatory",
        links: [
            { label: "Live demo", href: "https://sse-observatory.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/SSE-Observatory") },
            { label: "Release v2.0.0", href: `${gh("Ujjwaljain16/SSE-Observatory")}/releases/tag/v2.0.0` },
            { label: "sse-doctor on npm", href: "https://www.npmjs.com/package/sse-doctor" },
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
        headline: {
            value: "600 → 31 ms",
            label: "p95 timer lateness under a 20,000-event burst, after profiling found the Doctor re-sorting its window on every query",
        },
    },

    // ─── More projects ─────────────────────────────────────────────────────
    {
        id: "flashflow",
        name: "FlashFlow",
        tier: "more",
        tagline: "A Go lab that replays routing policies on identical traffic and classifies why one of them collapses under load.",
        status: "prototype",
        headline: { value: "10 / 10 seeds", label: "round-robin beat load-aware EWMA at 8 targets, which retired an earlier claim" },
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
        areas: ["infra-devops"],
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
        areas: ["backend"],
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
        tagline: "An MCP stdio proxy that checks every agent tool call and tracks where data read by earlier calls goes, to stop exfiltration, SSRF and path traversal.",
        status: "shipped",
        origin: "Personal project",
        period: "Feb 2026 – present · first build in one day, fail-closed fixes in Sep, 2.0 on npm 17 Nov 2026 (latest 2.0.1)",
        problem:
            "Agents get tools such as file access and shell. Enforce limits on those calls without modifying the agent. Allow-lists and regex argument rules miss encoded exfiltration, alternative IP spellings and ../ traversal, and they cannot see that data read in one call is being sent out in a later one.",
        approach: [
            "The proxy spawns the MCP server as a child process, parses JSON-RPC on stdin, runs each tool call through a chain of policy classes, then forwards or blocks it.",
            "Policies are configured in YAML validated with zod: per-tool allow/deny rules on arguments, rate and budget limits.",
            "Policies are evaluated in two phases: all of them validate first, and rate-limit, budget and approval state is committed only when the call is actually forwarded. Every refusal carries a decision trace, and refused tools are hidden from tools/list. (v4)",
            "Typed argument rules: paths are compared by directory boundary after resolving .., ~, file: URLs and Windows forms, and URLs go through the WHATWG parser with host allow and deny lists and loopback, private, link-local and metadata targets blocked in any numeric spelling. (v4)",
            "Secret-flow tracking: results from configured sources are fingerprinted by winnowing (k=16, window 5), so any shared normalised run of 20 or more characters is guaranteed to match, and outgoing arguments are checked plain and after base64, hex and percent decoding and reversal. Known credential formats are detected and protected. (v4)",
            "A \"lethal trifecta\" escalation: once protected data and untrusted content are both in a session, outgoing calls get a configurable action. (v4)",
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
            { text: "85 tests pass at the latest public commit (373adcd, 28 Sep 2026), with rogue-agent attack demos in the repository." },
            {
                text: "Published to npm as agentbrake: 1.0.0 on 10 Feb 2026, built from commit 0fc99c8 and so without the September fixes, and 2.0.0 on 17 Nov 2026, built and published by CI with npm trusted publishing and a provenance attestation (commit a6fc101). 2.0.1, a cleanup release the same day, is the current version.",
            },
            {
                text: "v4 (commit 28071e1, 17 Nov 2026): a deterministic attack scoreboard, the Gauntlet. 21 scripted attacks and 10 benign tasks run through the real proxy against an in-memory mock server, three ways. Blocked: 0 of 21 with everything allowed, 2 of 21 with a regex-only baseline, 18 of 21 with the v4 config; 0 of 10 benign tasks blocked in all three.",
                source: `bench/results/gauntlet.md@${AGENTBRAKE_V4}`,
            },
            {
                text: "The three attacks the Gauntlet misses stay in the suite as expected misses (a shell upload the proxy cannot see, a paraphrase with no untrusted content, an 8-character drip-feed), and CI is set to fail if any outcome changes in either direction.",
                source: `bench/scenarios.ts@${AGENTBRAKE_V4}`,
            },
            {
                text: "A property test over 300 seeds of the guarantee that any shared run of k + w - 1 characters shares a fingerprint.",
                source: `tests/flow.test.ts@${AGENTBRAKE_V4}`,
            },
            {
                text: "A test that the regex rule the old README warned about is bypassed while the typed path rule is not.",
                source: `tests/semantic.test.ts@${AGENTBRAKE_V4}`,
            },
            {
                text: "202 tests: 85 from the previous public commit and 117 new. On Windows 201 pass and the symlink test is skipped; the CI run on the v4 commit passed all 202 on Linux, on Node 20 and 22.",
            },
            {
                text: "In-process latency, one run of 3,000 calls on one laptop: p50 13.7 microseconds with no policy and 114 with the full Gauntlet config. This leaves out stdio pipes, process boundaries and server time, so it is not end-to-end overhead.",
                source: `bench/results/latency.md@${AGENTBRAKE_V4}`,
            },
            {
                text: "CI on the commit that was published: the tests pass on Node 20, 22 and 24, the Docker image builds and passes a smoke test, and the npm publish step succeeds. No 2.x image was pushed to Docker Hub, because that job skips without credentials. The first run on the v4 commit had failed at the publish step for lack of credentials.",
                source: `.github/workflows/ci.yml@${AGENTBRAKE_PUBLISHED}`,
            },
            {
                text: "The published 2.0.0 was installed from the public registry into a clean folder and driven over real stdio pipes against a real server process: 8 of 8 checks passed (tool-list filtering, path traversal, decimal-IP SSRF and base64 exfiltration blocked, benign calls forwarded, JSON logs). One run on one machine, 17 Nov 2026.",
            },
        ],
        limitations: [
            "Human approval is not implemented: a call that needs approval is refused with a pending error and nothing can approve it. A sandbox action is enforced as a block.",
            "Stdio only, and not a sandbox: argument rules are regular expressions, which are bypassable, and a server that ignores the proxy is out of scope.",
            "The budget policy counts calls at a flat cost; it does not track tokens or real spend.",
            "The first version failed open: any line the proxy could not parse, including a tool call split across stdin chunks, was forwarded unchecked, and an invalid policy file disabled enforcement. Both were fixed in Sep 2026 (see the decisions page).",
            "The first npm release, 1.0.0, was built before those fixes and fails open. 2.0.0 and later fail closed.",
            "The scoreboard and latency numbers were measured on one laptop on 15 Nov 2026. The only image on Docker Hub is 1.0.0 from February, which fails open; no 2.x image has been published there. The download count on npm includes mirrors and bots, so it is not a count of users.",
            "It is not a sandbox. What an allowed tool does is out of scope (a shell upload gets through), and data that is paraphrased with no untrusted content in the session is not caught.",
            "Pieces of data under 20 normalised characters are missed, and shared boilerplate of 16 or more characters can cause false positives.",
            "Symlinks and hard links are not followed unless resolve_symlinks is on, which is still racy. Redirects and DNS rebinding after the URL check are not covered. Only stdio tools/call is checked: resources, prompts and server-to-client requests pass through, and HTTP transports are not proxied. Regex rules remain bypassable.",
            "The Gauntlet's attacks and defences were written by the same author, the benign set is small and the mock server cooperates, so it shows what the mechanisms cover, not a real-world detection rate.",
            "The budget is an estimate, configurable per tool, not real token or spend tracking.",
            "Not measured: end-to-end latency (the benchmark is in-process), coverage percentage, and the new code on a real MCP server over stdio inside the test suite (the demos spawn one by hand).",
        ],
        tech: ["TypeScript", "Node.js", "zod", "Jest", "Docker"],
        areas: ["security", "ai"],
        next: [
            "Build human approval: a way to approve or deny a pending call that the agent cannot use on itself.",
            "Pin tool descriptions so a server cannot change what a tool says it does, and support Streamable HTTP.",
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
        areas: ["tools"],
        repo: "Ujjwaljain16/migratedb",
        links: [{ label: "Package on npm", href: "https://www.npmjs.com/package/@ujjwaljain16/migratedb" }],
    },
    {
        id: "campussync",
        name: "CampusSync",
        tier: "flagship",
        tagline: "Multi-tenant certificate verification for universities and recruiters, rebuilt after a security audit.",
        status: "prototype",
        headline: { value: "1,172 → 0.2 ms", label: "credential lookup at about one million certificates on real PostgreSQL (median of 3 rounds)" },
        origin: "Personal project",
        period: "Sep 2025 – Oct 2026 · 234 commits",
        problem: "Certificates are checked by hand and are easy to forge, so recruiters can't trust the ones they receive.",
        approach: [
            "Students upload certificates; Gemini vision extracts the fields and regular expressions normalise them; faculty approve.",
            "Approved certificates are issued as signed credentials (RS256 JWS in a W3C-VC-shaped JSON, with a did:web identifier) with revocation and public verification. One verifyCredential() service answers every public endpoint and fails closed.",
            "Roles live in one table (user_roles), credentials and the audit log are written only by the backend, and schema changes ship as staged migrations applied by a gated runner and replayed on PostgreSQL 17 in CI.",
        ],
        evidence: [
            { text: "100 API route files. A test fails the build when a route is neither guarded nor on an explicit public list.", source: "my-app/tests/security/route-inventory.test.ts" },
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
        areas: ["full-stack", "security"],
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
        status: "ongoing",
        headline: { value: "0 / 1,800", label: "requests dropped in rolling updates once a preStop delay was added (7 of 2,500 before)" },
        origin: "Personal project",
        period: "Oct 2026 – present · 94 commits",
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
        areas: ["backend", "infra-devops"],
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
        tagline:
            "Sync open browser tabs across devices, end-to-end encrypted: the server stores ciphertext and the account password never leaves the device. Metadata is visible to the server.",
        status: "shipped",
        origin: "Personal project",
        period: "Feb 2026 – present · 70 commits, v1.0 released 16 Nov 2026",
        problem: "Tab-sync tools usually upload your URLs to a server in plaintext, and the built-in browser sync is tied to one vendor.",
        approach: [
            "A browser extension (WXT, Chrome Manifest V3) captures open http(s) tabs, skips incognito tabs, and encrypts the list with a random AES-256-GCM master key before uploading. A Next.js PWA and other extensions unwrap the key locally to view snapshots and send a tab or window to another device.",
            "The password is stretched with PBKDF2-HMAC-SHA256 (600,000 iterations or more) and then split with HKDF into two independent keys: an authentication key that is sent to the server, which stores only an scrypt hash of it, and a wrapping key for the master key that never leaves the device. A 100-bit recovery code wraps the same master key.",
            "Snapshots are bound to the user, the device and the capture time as AES-GCM additional data, so the server cannot relabel an old snapshot as new or move one between devices. Send-tab URLs and saved-session labels are encrypted too.",
            "A Fastify and PostgreSQL backend stores ciphertext, wrapped keys and metadata. Sessions are revocable per user, and clients refuse a server that tries to lower the key-derivation cost.",
        ],
        evidence: [
            {
                text: "All cryptography is in one module with its parameters written next to the code: PBKDF2-HMAC-SHA256 with 600,000 iterations or more, an HKDF split into an authentication key and a wrapping key, and AES-256-GCM.",
                source: `shared/src/crypto.ts@${VAULTTABS_V105}`,
            },
            {
                text: "A written security model says what each actor can see and what is not protected: a curious or malicious server, a database thief, a network attacker, a cross-site-scripting bug and a stolen device. It ends with ten known limitations.",
                source: `docs/security-model.md@${VAULTTABS_V105}`,
            },
            {
                text: "A 66-scenario end-to-end suite drives the real extension in two Chromium profiles and the real PWA against a real backend and PostgreSQL. It found three bugs, one of them a security bug: a revoked token kept receiving tabs over an open stream (commit 00ad71e).",
                source: "e2e/playwright.config.ts@" + VAULTTABS_V105,
            },
            {
                text: "CI on the v1.0.5 commit: 58 unit and integration tests and the 66 end-to-end scenarios pass, with typecheck, lint, the build, both Docker images and CodeQL green.",
                source: `.github/workflows/ci.yml@${VAULTTABS_V105}`,
            },
            {
                text: "The 1.0 release (commit 5102547) fixed a cross-tenant defect, where a user could rename or take over another user's device through /devices/register, and made sessions revocable: signing out everywhere, a password change, recovery or account deletion end every session.",
            },
            {
                text: "A Sep 2026 review fixed real defects: restore requests could be read or completed by any logged-in user, JWTs never expired, CORS was open outside production, and the docker-compose healthchecks were malformed so the backend never started.",
                source: `backend/src/services/restore.service.ts@${VAULTTABS_V105}`,
            },
        ],
        limitations: [
            "Metadata is visible to the server: email, device names, timestamps, snapshot sizes and counts, IP addresses, and which device sent what to which device.",
            "The web dashboard trusts the server that serves it: an operator who is malicious or compromised could ship JavaScript that steals keys. The extension, whose code is fixed at install, is the stronger client, and self-hosting is the other option.",
            "A downgrade gap remains for accounts created before 1.0: an actively malicious server could claim an upgraded account is still on the legacy login and receive the password at the next login. Legacy support is meant to be removed in a future major version.",
            "There is no email verification, and registration reveals whether an email has an account (it is rate-limited). The web dashboard keeps its token in localStorage, where a cross-site-scripting bug could read it, and rate limiting is in memory, per instance.",
            "Rollback and replay are detectable, not prevented: the server can serve an older genuine snapshot, with its true timestamp, or re-deliver a genuine send-tab payload to the same device. Keys at rest on clients are non-extractable but not encrypted.",
            "Early commits contain development certificates with private keys. They are not used, but they are in the git history, which has not been rewritten, so treat them as compromised.",
            "No independent audit has been performed.",
            "The first README and the app copy claimed zero-knowledge. That was wrong while the password was sent to the server; it was corrected in Sep 2026 and the design was fixed in 1.0.",
        ],
        tech: ["TypeScript", "WXT", "Next.js", "Fastify", "PostgreSQL", "WebCrypto", "Docker", "Vitest", "Playwright"],
        areas: ["security", "full-stack"],
        next: [
            "Remove the legacy login in a future major version, which closes the downgrade gap.",
            "Move the web dashboard's token from localStorage to an httpOnly cookie, which the repository lists as possible future work.",
            "Have an independent audit done.",
        ],
        repo: "Ujjwaljain16/VaultTabs",
        links: [
            { label: "Live demo", href: "https://vaulttabs.vercel.app" },
            { label: "Source on GitHub", href: gh("Ujjwaljain16/VaultTabs") },
            { label: "Security model", href: `${gh("Ujjwaljain16/VaultTabs")}/blob/${VAULTTABS_V105}/docs/security-model.md` },
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
        areas: ["backend"],
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
        areas: ["mobile"],
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
    {
        name: "BHTTP-1",
        repo: "Ujjwaljain16/BHTTP-1-HTTP-in-Binary",
        line: "A binary, HTTP-like protocol over persistent TCP, written in Go with a spec, server, client and chaos proxy. Personal project, Sep 2026.",
    },
];

// The order of the Selected work cards on the home page.
const FEATURED_ORDER = ["fuze", "campussync", "campusslot", "warrant", "sse-observatory", "minidb"];
const featuredRank = (id: string) => {
    const i = FEATURED_ORDER.indexOf(id);
    return i === -1 ? FEATURED_ORDER.length : i;
};
export const featuredProjects = projects.filter((p) => p.tier === "flagship").sort((a, b) => featuredRank(a.id) - featuredRank(b.id));
// The order of More projects. A project not listed here goes after these, in the order it is listed above.
const MORE_ORDER = ["typeaheadx", "agentbrake", "vaulttabs", "recoveryos", "flashflow", "migratedb", "spentsmart", "ecommerce-backend"];
const moreRank = (id: string) => {
    const i = MORE_ORDER.indexOf(id);
    return i === -1 ? MORE_ORDER.length : i;
};
export const moreProjects = projects.filter((p) => p.tier === "more").sort((a, b) => moreRank(a.id) - moreRank(b.id));
/** Every project in reading order (the featured ones first, as on the home page): the order of previous and next. */
export const orderedProjects = [...featuredProjects, ...moreProjects];

/**
 * A period such as "Feb 2026 – present · first build in one day" split into the dates and the note after the first
 * middle dot, so a page can show the dates large and the note beside them.
 */
export function splitPeriod(period: string): { dates: string; note?: string } {
    const i = period.indexOf(" · ");
    return i === -1 ? { dates: period } : { dates: period.slice(0, i), note: period.slice(i + 3) };
}

export function getProject(id: string): Project | undefined {
    return projects.find((p) => p.id === id);
}

/**
 * Link to a file in a project's repository. `path` is `dir/file.ext` (the repository's default branch, which can move or be
 * restructured) or `dir/file.ext@<commit sha>`, which is permanent: use it for files that exist only on a branch that is not
 * the default, or whose location may change.
 */
export function sourceUrl(repo: string, path: string): string {
    const { file, ref } = splitSource(path);
    return `https://github.com/${repo}/blob/${ref ?? "HEAD"}/${file}`;
}

function splitSource(path: string): { file: string; ref?: string } {
    const m = /^(.*)@([0-9a-f]{7,40})$/.exec(path);
    return m ? { file: m[1], ref: m[2] } : { file: path };
}

/** What a reader sees for a source: the file name, without any `@sha`. */
export function sourceLabel(path: string): string {
    return splitSource(path).file.split("/").pop() ?? path;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
    ongoing: "ONGOING",
    shipped: "SHIPPED",
    prototype: "PROTOTYPE",
    "in-progress": "IN PROGRESS",
};
