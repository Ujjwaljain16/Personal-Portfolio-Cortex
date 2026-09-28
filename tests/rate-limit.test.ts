import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const PER = { limit: 2, windowMs: 1000 };
const ALL = { limit: 100, windowMs: 1000 };

afterEach(() => vi.useRealTimers());

describe("checkRateLimit", () => {
    it("allows up to the per-client limit, then rejects with a retry hint", () => {
        vi.useFakeTimers();
        const id = `client-${Math.random()}`;
        expect(checkRateLimit(id, PER, ALL).ok).toBe(true);
        expect(checkRateLimit(id, PER, ALL).ok).toBe(true);
        const third = checkRateLimit(id, PER, ALL);
        expect(third.ok).toBe(false);
        expect(third.retryAfter).toBeGreaterThanOrEqual(1);
    });

    it("lets the same client back in after the window passes", () => {
        vi.useFakeTimers();
        const id = `client-${Math.random()}`;
        checkRateLimit(id, PER, ALL);
        checkRateLimit(id, PER, ALL);
        expect(checkRateLimit(id, PER, ALL).ok).toBe(false);
        vi.advanceTimersByTime(1001);
        expect(checkRateLimit(id, PER, ALL).ok).toBe(true);
    });

    it("counts clients separately", () => {
        const a = `a-${Math.random()}`;
        const b = `b-${Math.random()}`;
        checkRateLimit(a, PER, ALL);
        checkRateLimit(a, PER, ALL);
        expect(checkRateLimit(a, PER, ALL).ok).toBe(false);
        expect(checkRateLimit(b, PER, ALL).ok).toBe(true);
    });

    it("does not charge the client for a request the global window rejected", () => {
        vi.useFakeTimers();
        vi.advanceTimersByTime(60_000); // start from a clean global window
        const tightGlobal = { limit: 1, windowMs: 1000 };
        const first = `g1-${Math.random()}`;
        const second = `g2-${Math.random()}`;
        expect(checkRateLimit(first, PER, tightGlobal).ok).toBe(true);
        expect(checkRateLimit(second, PER, tightGlobal).ok).toBe(false);
        vi.advanceTimersByTime(1001);
        // `second` was rejected globally, so it still has its full per-client budget.
        expect(checkRateLimit(second, PER, tightGlobal).ok).toBe(true);
    });
});

describe("getClientId", () => {
    const req = (headers: Record<string, string>) => new Request("http://localhost/x", { headers });

    it("prefers the Vercel header, then x-forwarded-for, then x-real-ip", () => {
        expect(getClientId(req({ "x-vercel-forwarded-for": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
        expect(getClientId(req({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
        expect(getClientId(req({ "x-real-ip": "4.4.4.4" }))).toBe("4.4.4.4");
        expect(getClientId(req({}))).toBe("unknown");
    });
});
