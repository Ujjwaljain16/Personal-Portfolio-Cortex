/**
 * Where each system runs. Only facts that could be checked are listed: no
 * commit hashes, latency figures or uptime claims, because none were backed by
 * a source. `liveUrl` points at the place a visitor can actually go.
 */

export type DeploymentCategory = "live" | "device" | "runtime";

export type DeploymentStatus = "active" | "partial" | "device" | "published" | "library";

export interface Deployment {
    id: string;
    repo: string;
    summary: string;
    impact: string;
    category: DeploymentCategory;
    runtime: string;
    host: string;
    liveUrl?: string;
    status: DeploymentStatus;
    tags: string[];
    /** ids from src/data/records.ts */
    relatedRecordIds?: string[];
}

export const CATEGORY_LABELS: Record<DeploymentCategory, string> = {
    live: "LIVE WEB SYSTEMS",
    device: "DEVICE RUNTIME",
    runtime: "PACKAGES & LIBRARIES",
};

export const CATEGORY_ORDER: DeploymentCategory[] = ["live", "device", "runtime"];

export const deployments: Deployment[] = [
    {
        id: "deploy-001",
        repo: "Fuze",
        summary: "React frontend on Vercel; Flask backend on a free Hugging Face Space",
        impact:
            "The frontend is deployed on Vercel. The Flask backend ships as a Docker container (gunicorn with gevent, RQ workers under supervisord) on a free Hugging Face Space, with Supabase for PostgreSQL and Upstash for Redis. The Space was flagged twice for browser automation and the image is now browser-free. Its readiness endpoint reported the database, Redis and schema ready on 14 Oct 2026, and CI gates the deploy. Throughput under load has not been measured.",
        category: "live",
        runtime: "Web App",
        host: "Vercel (frontend) · Hugging Face Spaces (backend)",
        liveUrl: "https://itsfuze.vercel.app",
        status: "active",
        tags: ["fullstack", "ai"],
        relatedRecordIds: ["verify-against-real-infrastructure", "fuze-semantic-search-latency-series", "fuze-redis-command-budget"],
    },
    {
        id: "deploy-002",
        repo: "CampusSync",
        summary: "Multi-tenant certificate verification on Vercel and Supabase",
        impact:
            "A Next.js app on Vercel with Supabase for PostgreSQL, auth and storage. Certificates are extracted with Gemini vision, approved by faculty, and issued as RS256-signed credentials with revocation and public verification.",
        category: "live",
        runtime: "Web App",
        host: "Vercel + Supabase",
        liveUrl: "https://campusync1.vercel.app",
        status: "active",
        tags: ["fullstack", "multi-tenant"],
        relatedRecordIds: ["campus-ocr-tesseract-to-gemini-vision"],
    },
    {
        id: "deploy-003",
        repo: "SpentSmart",
        summary: "Offline-first Android expense tracker, distributed as APKs on GitHub Releases",
        impact:
            "A React Native and Expo app with a custom Kotlin native module for UPI intents. It has no backend: data stays on the device behind an optional biometric lock. Three APK releases (v1.0.0, v2.0.0, v2.01) are on GitHub Releases.",
        category: "device",
        runtime: "Mobile (Android)",
        host: "GitHub Releases",
        liveUrl: "https://github.com/Ujjwaljain16/SpentSmart/releases",
        status: "device",
        tags: ["mobile", "offline-first"],
        relatedRecordIds: ["spentsmart-native-upi-module"],
    },
    {
        id: "deploy-004",
        repo: "AgentBrake",
        summary: "MCP policy proxy, published to npm and Docker Hub",
        impact:
            "Published as agentbrake (v1.0.0, February 2026) on npm and as a Docker Hub image. It wraps an MCP server over stdio and applies allow/block policies and regex argument filtering. The published v1.0.0 predates the Sep 2026 fixes (fail-closed parsing and config, a working circuit breaker), which are on the main branch but not yet released. Human approval is not implemented.",
        category: "runtime",
        runtime: "CLI + Library",
        host: "npm · Docker Hub",
        liveUrl: "https://www.npmjs.com/package/agentbrake",
        status: "published",
        tags: ["ai-safety", "package"],
        relatedRecordIds: ["ab-circuit-breaker-and-approval-not-driveable"],
    },
    {
        id: "deploy-005",
        repo: "migrateDB",
        summary: "Database migration CLI and library, published to npm",
        impact:
            "Published as @ujjwaljain16/migratedb (v1.0.1) with ESM and CommonJS builds. Migrations are ordered by declared dependencies and guarded by a lock table. The source repository is currently private, so only the package is public.",
        category: "runtime",
        runtime: "CLI + Library",
        host: "npm",
        liveUrl: "https://www.npmjs.com/package/@ujjwaljain16/migratedb",
        status: "published",
        tags: ["database", "package"],
        relatedRecordIds: ["migratedb-dfs-depends-ordering", "migratedb-stale-lock-after-kill"],
    },
    {
        id: "deploy-006",
        repo: "HttpServer",
        summary: "HTTP/1.1 server on raw sockets in Python's standard library",
        impact:
            "Runs locally; there is no hosted instance. A bounded thread pool returns 503 when saturated, each client IP is rate limited, and a Prometheus /metrics endpoint is exposed.",
        category: "runtime",
        runtime: "Library",
        host: "Runs locally (Python stdlib)",
        status: "library",
        tags: ["networking", "stdlib"],
    },
];
