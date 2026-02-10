export type DeploymentCategory = "live" | "device" | "runtime";

export type DeploymentStatus = "active" | "device" | "packaged" | "published" | "library";

export interface Deployment {
    id: string;
    repo: string;
    commit: string;
    commitMessage: string;
    impact: string;
    category: DeploymentCategory;
    runtime: string;
    host: string;
    liveUrl?: string;
    latencyChange?: string;
    observed?: boolean;
    status: DeploymentStatus;
    tags: string[];
    date: string;
    relatedDecisionId?: string;
    relatedExperimentId?: string;
}

export const CATEGORY_LABELS: Record<DeploymentCategory, string> = {
    live: "LIVE WEB SYSTEMS",
    device: "DEVICE RUNTIME",
    runtime: "RUNTIME SYSTEMS",
};

export const CATEGORY_ORDER: DeploymentCategory[] = ["live", "device", "runtime"];

export const deployments: Deployment[] = [

    // ═══════════════════════════════════════════════════════════════════
    //  LIVE WEB SYSTEMS — production web endpoints users can visit
    // ═══════════════════════════════════════════════════════════════════

    {
        id: "deploy-001",
        repo: "Fuze",
        commit: "a3f81d2",
        commitMessage: "Full-stack AI recommendation engine — live on Vercel + HF Spaces",
        impact: "React frontend served via Vercel Edge Network. Flask + Gunicorn backend on HuggingFace Spaces (python:3.11-slim, gevent async, 1000 connections). Dual-process container runs RQ worker + API server. Conditional blueprint degraded mode if Redis is down.",
        category: "live",
        runtime: "Web App",
        host: "Vercel + HuggingFace Spaces",
        liveUrl: "https://itsfuze.vercel.app",
        latencyChange: "TTFB 386ms (frontend) · 457ms (backend API)",
        observed: true,
        status: "active",
        tags: ["fullstack", "ai", "edge"],
        date: "2026-02-10",
        relatedDecisionId: "ADR-FZ-06",
        relatedExperimentId: "EXP-10",
    },
    {
        id: "deploy-002",
        repo: "CampusSync",
        commit: "71f3b2e",
        commitMessage: "Multi-tenant university platform — live on Vercel + Supabase",
        impact: "Next.js frontend on Vercel with production security headers (HSTS, CSP, COEP, CORP). Supabase PostgreSQL with 83 RLS policies across 12 migrations. Ed25519 credential signing. UptimeRobot keep-alive prevents Supabase cold starts. Dual OCR pipeline (Tesseract + Gemini) behind feature flag.",
        category: "live",
        runtime: "Web App",
        host: "Vercel + Supabase",
        liveUrl: "https://campusync1.vercel.app",
        latencyChange: "TTFB 1210ms (SSR with Supabase round-trip)",
        observed: true,
        status: "active",
        tags: ["fullstack", "security", "edge"],
        date: "2026-02-10",
        relatedDecisionId: "ADR-01",
        relatedExperimentId: "EXP-06",
    },

    // ═══════════════════════════════════════════════════════════════════
    //  DEVICE RUNTIME — native apps running on user devices
    // ═══════════════════════════════════════════════════════════════════

    {
        id: "deploy-003",
        repo: "SpentSmart",
        commit: "c5d1f38",
        commitMessage: "Offline-first expense tracker — Android APK via GitHub Releases",
        impact: "React Native + Expo SDK 54 app. Custom Kotlin UPI Intent native module for Android payment intents. Zero-backend architecture — all data in AsyncStorage, no network calls, no telemetry. Biometric lock via expo-local-authentication. EAS Build pipeline (dev → preview → production). v2.01 release APK on GitHub.",
        category: "device",
        runtime: "Mobile",
        host: "GitHub Releases",
        liveUrl: "https://github.com/Ujjwaljain16/SpentSmart/releases/download/v2.01/SpentSmartV2.01Release.apk",
        latencyChange: "0ms network (fully offline)",
        status: "device",
        tags: ["mobile", "offline-first", "local-runtime"],
        date: "2026-02-10",
        relatedDecisionId: "ADR-SS-01",
        relatedExperimentId: "EXP-14",
    },

    // ═══════════════════════════════════════════════════════════════════
    //  RUNTIME SYSTEMS — CLI tools, libraries, dev tools
    // ═══════════════════════════════════════════════════════════════════

    {
        id: "deploy-004",
        repo: "AgentBrake",
        commit: "b3e8f15",
        commitMessage: "MCP safety proxy — published npm package",
        impact: "Installed via `npm i agentbrake` as drop-in CLI wrapper around any MCP server. Stdio proxy intercepts all JSON-RPC tool calls — runs schema validation, DLP regex scanning, and budget enforcement as ordered policy middleware. Sliding-window circuit breaker trips after N failures in T seconds. YAML config-as-code with Zod validation. Docker multi-stage build available (node:20-alpine, HEALTHCHECK, <150MB). Published as v1.0.0 with built-in TypeScript declarations.",
        category: "runtime",
        runtime: "CLI + Library",
        host: "npm",
        liveUrl: "https://www.npmjs.com/package/agentbrake",
        latencyChange: "+4ms per tool call (policy chain overhead)",
        observed: true,
        status: "published",
        tags: ["security", "ai-safety", "package", "npm"],
        date: "2026-02-10",
        relatedDecisionId: "ADR-AB-02",
        relatedExperimentId: "EXP-41",
    },
    {
        id: "deploy-005",
        repo: "MigrateDB",
        commit: "f4c2a18",
        commitMessage: "Database migration toolkit — CLI + library via npm",
        impact: "Consumed as dependency or executed via npx migratedb migrate. Transaction-wrapped migration runner — each migration rolls back cleanly on failure. Advisory locks prevent concurrent execution across instances. Multi-database adapter pattern (Postgres, MySQL, SQLite). Topological sort for dependency ordering. Dual-format build (ESM + CJS) with package.json exports map.",
        category: "runtime",
        runtime: "CLI + Library",
        host: "npm",
        liveUrl: "https://www.npmjs.com/package/@ujjwaljain16/migratedb",
        latencyChange: "~12ms per migration (advisory lock acquire + tx commit)",
        status: "published",
        tags: ["database", "migrations", "package"],
        date: "2026-02-10",
        relatedDecisionId: "ADR-MG-01",
        relatedExperimentId: "EXP-22",
    },
    {
        id: "deploy-006",
        repo: "HttpServer",
        commit: "e1f2b3c",
        commitMessage: "Production-grade HTTP/1.1 server — Python stdlib only",
        impact: "Zero external dependencies — built entirely on Python 3.11+ stdlib. HTTP/1.1 keep-alive (30s idle timeout, max 100 req/conn). Bounded thread pool (configurable workers, max 64 queue) returns 503 under saturation instead of crashing. Thread-safe connection pool with periodic stale cleanup. Per-IP rate limiter with security dashboard endpoint. SIGINT graceful shutdown drains in-flight requests. MetricsCollector tracks per-endpoint response times and throughput.",
        category: "runtime",
        runtime: "Library",
        host: "Python stdlib",
        latencyChange: "~0.2ms per request (routing + middleware overhead)",
        status: "library",
        tags: ["networking", "stdlib", "local-runtime"],
        date: "2026-02-10",
    },
];
