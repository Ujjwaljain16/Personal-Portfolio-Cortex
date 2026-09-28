import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Deliberately simple: state lives in module memory, so on a serverless host
 * each warm instance keeps its own counters. That is enough to blunt casual
 * abuse of a public portfolio endpoint; it is NOT a distributed guarantee.
 * If real traffic ever needs one, swap the store for Redis/KV behind the same
 * `checkRateLimit` signature.
 */

interface Window {
    /** Max requests allowed inside `windowMs`. */
    limit: number;
    windowMs: number;
}

const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

export interface RateLimitResult {
    ok: boolean;
    /** Seconds until the caller may retry (only meaningful when `ok` is false). */
    retryAfter: number;
}

function check(key: string, { limit, windowMs }: Window, now: number): RateLimitResult {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
    }

    recent.push(now);
    hits.set(key, recent);
    return { ok: true, retryAfter: 0 };
}

/**
 * Applies a per-client window and a global (per-instance) window.
 * A request that is rejected by either window is not counted against the other.
 */
export function checkRateLimit(
    clientId: string,
    perClient: Window,
    global: Window
): RateLimitResult {
    const now = Date.now();

    // Bound memory: drop everything if the map grows unreasonably.
    if (hits.size > MAX_KEYS) hits.clear();

    const client = check(`c:${clientId}`, perClient, now);
    if (!client.ok) return client;

    const all = check("global", global, now);
    if (!all.ok) {
        // Give back the per-client slot we just took.
        const key = `c:${clientId}`;
        hits.set(key, (hits.get(key) ?? []).slice(0, -1));
        return all;
    }
    return { ok: true, retryAfter: 0 };
}

/** Best-effort client identifier from proxy headers (Vercel sets these). */
export function getClientId(req: Request): string {
    const forwarded = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
    return ip || "unknown";
}
