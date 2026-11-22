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
    live: "Live on the web",
    device: "On a device",
    runtime: "Published packages",
};

export const CATEGORY_ORDER: DeploymentCategory[] = ["live", "device", "runtime"];

export const deployments: Deployment[] = [
    {
        id: "deploy-001",
        repo: "Fuze",
        summary: "React frontend on Vercel; Flask backend on a free Hugging Face Space",
        impact:
            "The frontend is deployed on Vercel. The Flask backend ships as a Docker container (gunicorn with gevent, RQ workers under supervisord) on a free Hugging Face Space, with Supabase for PostgreSQL and Upstash for Redis.",
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
        id: "deploy-007",
        repo: "SSE-Observatory",
        summary: "Hosted demo of the SSE debugger on Vercel",
        impact:
            "A hosted demo on Vercel serves v2.0.0, the release merged to main on 15 Nov 2026. The command-line part is published separately to npm as sse-doctor.",
        category: "live",
        runtime: "Web App",
        host: "Vercel",
        liveUrl: "https://sse-observatory.vercel.app",
        status: "active",
        tags: ["devtools", "sse"],
        relatedRecordIds: ["sse-close-the-open-relay"],
    },
    {
        id: "deploy-009",
        repo: "VaultTabs",
        summary: "The VaultTabs web app (a PWA) for end-to-end encrypted tab sync, on Vercel",
        impact:
            "The Next.js web app is live on Vercel and installs as a PWA. It unwraps the encryption key in the browser to show the tab snapshots the extension uploads, so the server stores ciphertext and the account password never leaves the device; metadata is visible to the server. Version 1.0 was released on 16 Nov 2026.",
        category: "live",
        runtime: "Web App (PWA)",
        host: "Vercel",
        liveUrl: "https://vaulttabs.vercel.app",
        status: "active",
        tags: ["security", "pwa"],
    },
    {
        id: "deploy-003",
        repo: "SpentSmart",
        summary: "Local-first Android expense tracker, distributed as APKs on GitHub Releases",
        impact:
            "A React Native and Expo app with a custom Kotlin native module for UPI intents and an encrypted on-device database. Five APK releases are on GitHub; the latest is v2.2.1 (published 22 Nov 2026 UTC), with a SHA-256 file. It is sideloaded, not on the Play Store.",
        category: "device",
        runtime: "Mobile (Android)",
        host: "GitHub Releases",
        liveUrl: "https://github.com/Ujjwaljain16/SpentSmart/releases/tag/v2.2.1",
        status: "device",
        tags: ["mobile", "local-first"],
        relatedRecordIds: ["spentsmart-native-upi-module", "spentsmart-e2e-encrypted-sync"],
    },
    {
        id: "deploy-010",
        repo: "SpentSmart",
        summary: "The optional sync server for SpentSmart, on Render's free tier with Neon Postgres",
        impact:
            "A Fastify API that stores only ciphertext and sync bookkeeping, with Postgres row-level security. Its health check returned ok on 23 Nov 2026. It is used only when someone signs in with Google to turn sync on, and it sleeps when idle, so the first request after a while is slow. Whether Google sign-in is open beyond listed test users is not verified.",
        category: "live",
        runtime: "API server",
        host: "Render + Neon",
        liveUrl: "https://spentsmart.onrender.com/healthz",
        status: "active",
        tags: ["backend", "e2e-encryption"],
        relatedRecordIds: ["spentsmart-e2e-encrypted-sync"],
    },
    {
        id: "deploy-004",
        repo: "AgentBrake",
        summary: "MCP policy proxy, published to npm (2.0.1)",
        impact:
            "Published to npm as agentbrake: 2.0.0 and 2.0.1 on 17 Nov 2026, built and published by CI with a provenance attestation. It wraps an MCP server over stdio and checks every tool call against typed path and URL rules and secret-flow tracking.",
        category: "runtime",
        runtime: "CLI + Library",
        host: "npm · Docker Hub (1.0.0 only)",
        liveUrl: "https://www.npmjs.com/package/agentbrake",
        status: "published",
        tags: ["ai-safety", "package"],
        relatedRecordIds: ["ab-circuit-breaker-and-approval-not-driveable"],
    },
    {
        id: "deploy-008",
        repo: "SSE-Observatory",
        summary: "sse-doctor, the command-line diagnosis tool, published to npm (2.0.1)",
        impact:
            "Published to npm as sse-doctor: 2.0.0 on 15 Nov 2026 and 2.0.1 on 16 Nov 2026, both built from commits now on main. It finds out why an SSE stream is stuck, late or losing events and turns the diagnosis into a repeatable test. The releases were published by hand and carry no provenance attestation.",
        category: "runtime",
        runtime: "CLI",
        host: "npm",
        liveUrl: "https://www.npmjs.com/package/sse-doctor",
        status: "published",
        tags: ["devtools", "package"],
        relatedRecordIds: ["sse-doctor-overhead-and-the-resorting-bug"],
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
];
