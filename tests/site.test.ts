import { describe, expect, it } from "vitest";
import { resolveSiteUrl, SITE_HOST, SITE_URL } from "@/lib/site";

const DEFAULT = "https://ujjwaljain.vercel.app";

describe("resolveSiteUrl", () => {
    it("falls back to the default when the setting is missing or blank", () => {
        expect(resolveSiteUrl(undefined)).toBe(DEFAULT);
        expect(resolveSiteUrl("")).toBe(DEFAULT);
    });

    it("accepts an https origin and normalises a trailing slash and whitespace", () => {
        expect(resolveSiteUrl("https://ujjwaljain16.me")).toBe("https://ujjwaljain16.me");
        expect(resolveSiteUrl("https://ujjwaljain16.me/")).toBe("https://ujjwaljain16.me");
        expect(resolveSiteUrl("  https://ujjwaljain16.me  ")).toBe("https://ujjwaljain16.me");
    });

    it("refuses anything that would publish a wrong canonical URL", () => {
        for (const bad of ["http://ujjwaljain16.me", "ujjwaljain16.me", "https://ujjwaljain16.me/blog", "https://ujjwaljain16.me/?a=1", "https://ujjwaljain16.me/#x", "not a url"]) {
            expect(resolveSiteUrl(bad), bad).toBe(DEFAULT);
        }
    });
});

describe("site constants", () => {
    it("keep the host consistent with the origin", () => {
        expect(SITE_URL.startsWith("https://")).toBe(true);
        expect(SITE_URL.endsWith("/")).toBe(false);
        expect(new URL(SITE_URL).host).toBe(SITE_HOST);
    });
});
