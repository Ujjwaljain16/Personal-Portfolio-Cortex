import { describe, expect, it } from "vitest";
import { cleanTitle, formatStars, normalize, projectName, render, summaryFromBody } from "../scripts/lib/github-sync.mjs";
import { mergedPRs, openPRs, orphanedCurated } from "@/data/openSource";
import { nowItems, nowSyncedAt } from "@/data/now";

const NOW = new Date("2026-11-14T12:00:00Z");

function node(over: Record<string, unknown> = {}) {
    return {
        number: 1,
        title: "fix(core): handle the thing",
        url: "https://github.com/acme/widgets/pull/1",
        state: "MERGED",
        isDraft: false,
        createdAt: "2026-11-01T00:00:00Z",
        updatedAt: "2026-11-10T00:00:00Z",
        mergedAt: "2026-11-10T00:00:00Z",
        reviewDecision: "APPROVED",
        bodyText: "A real description that is long enough to be used as the summary line.",
        repository: { nameWithOwner: "acme/widgets", stargazerCount: 1500, isPrivate: false, owner: { login: "acme" } },
        ...over,
    };
}

describe("formatStars", () => {
    it("rounds down to thousands and leaves small counts exact", () => {
        expect(formatStars(75523)).toBe("75k");
        expect(formatStars(3048)).toBe("3k");
        expect(formatStars(999)).toBe("999");
        expect(formatStars(29)).toBe("29");
    });
});

describe("cleanTitle", () => {
    it("drops a conventional-commit prefix and capitalises a plain word", () => {
        expect(cleanTitle("fix(ci): fall back to the lean Dockerfile target")).toBe("Fall back to the lean Dockerfile target");
        expect(cleanTitle("feat!: add a thing")).toBe("Add a thing");
    });
    it("leaves identifiers and unprefixed titles alone", () => {
        expect(cleanTitle("conformance: avoid nil Group panic")).toBe("conformance: avoid nil Group panic"); // a project's own scope prefix
        expect(cleanTitle("parentRefToString prints a pointer")).toBe("parentRefToString prints a pointer");
        expect(cleanTitle("Publish the recovered log end")).toBe("Publish the recovered log end");
    });
});

describe("projectName", () => {
    it("uses the known display name, else Title Case of the repository", () => {
        expect(projectName("apache/superset")).toBe("Apache Superset");
        expect(projectName("Kubernetes-Sigs/Gateway-API")).toBe("Kubernetes Gateway API");
        expect(projectName("someone/cool-new_tool")).toBe("Cool New Tool");
    });
});

describe("summaryFromBody", () => {
    it("skips a Kubernetes-style template down to the description", () => {
        const body = "What type of PR is this?\n/kind bug\n/area conformance-machinery\nWhat this PR does / why we need it:\nthe helper dereferenced a nil pointer when the list was empty, so it panicked instead of returning false\nWhich issue(s) this PR fixes:\nFixes #1";
        expect(summaryFromBody(body)).toBe("The helper dereferenced a nil pointer when the list was empty, so it panicked instead of returning false");
    });
    it("starts after a SUMMARY heading and ignores a leading Fixes line", () => {
        const body = "Fixes #12.\nSUMMARY\nThe cache key ignored row-level security, so two viewers could share one result.\nTESTING INSTRUCTIONS\nRun it.";
        expect(summaryFromBody(body)).toBe("The cache key ignored row-level security, so two viewers could share one result.");
    });
    it("trims a long paragraph at a sentence end", () => {
        const sentence = "The first checkpoint after recovery put the old position back and that left a half written transaction in the replay window.";
        const out = summaryFromBody(`${sentence} ${"More detail follows here that goes on. ".repeat(20)}`);
        expect(out.length).toBeLessThanOrEqual(300);
        expect(out.endsWith(".")).toBe(true);
    });
    it("never returns text from a body with personal details", () => {
        expect(summaryFromBody("Name: Someone\nRoll Number: 24bcs10173\nThis submission covers the lab in full detail here.")).toBe("");
        expect(summaryFromBody("Contact me at someone@example.com about this change which is described at some length.")).toBe("");
    });
    it("returns an empty string when there is nothing usable", () => {
        expect(summaryFromBody("")).toBe("");
        expect(summaryFromBody("Fixes #3")).toBe("");
        expect(summaryFromBody("/kind bug")).toBe("");
    });
});

describe("normalize", () => {
    it("lists merged pull requests newest first with cleaned titles and rounded stars", () => {
        const { merged } = normalize(
            [node({ number: 2, mergedAt: "2026-10-01T00:00:00Z" }), node({ number: 3, mergedAt: "2026-11-10T00:00:00Z" })],
            NOW,
        );
        expect(merged.map((p: { number: number }) => p.number)).toEqual([3, 2]);
        expect(merged[0]).toMatchObject({ project: "Widgets", stars: "1k", title: "Handle the thing", merged: "2026-11-10" });
    });

    it("skips my own repositories, private ones, small projects and the deny list", () => {
        const { merged } = normalize(
            [
                node({ number: 10, repository: { nameWithOwner: "Ujjwaljain16/Fuze", stargazerCount: 90, isPrivate: false, owner: { login: "Ujjwaljain16" } } }),
                node({ number: 11, repository: { nameWithOwner: "acme/secret", stargazerCount: 900, isPrivate: true, owner: { login: "acme" } } }),
                node({ number: 12, repository: { nameWithOwner: "acme/tiny", stargazerCount: 5, isPrivate: false, owner: { login: "acme" } } }),
                node({ number: 13, repository: { nameWithOwner: "KnightKnight27/scaler-Adv-DBMS", stargazerCount: 500, isPrivate: false, owner: { login: "KnightKnight27" } } }),
                node({ number: 14 }),
            ],
            NOW,
        );
        expect(merged.map((p: { number: number }) => p.number)).toEqual([14]);
    });

    it("lists only fresh, non-draft open pull requests, with a factual note", () => {
        const base = { state: "OPEN", mergedAt: null, reviewDecision: "REVIEW_REQUIRED" };
        const { open, merged } = normalize(
            [
                node({ ...base, number: 20 }),
                node({ ...base, number: 21, isDraft: true }),
                node({ ...base, number: 22, updatedAt: "2026-08-01T00:00:00Z" }),
                node({ ...base, number: 23, reviewDecision: "CHANGES_REQUESTED" }),
            ],
            NOW,
        );
        expect(merged).toEqual([]);
        expect(open.map((p: { number: number }) => p.number)).toEqual([23, 20]);
        expect(open[1].note).toBe("Opened 2026-11-01, last activity 2026-11-10. Waiting for review.");
        expect(open[0].note).toContain("Changes requested.");
    });

    it("renders byte-identical text for identical data, so an unchanged day makes no commit", () => {
        const a = normalize([node()], NOW);
        const b = normalize([node()], NOW);
        expect(render(a)).toBe(render(b));
    });
});

describe("the generated data as the site uses it", () => {
    it("has no hand-written summary that matches nothing", () => {
        expect(orphanedCurated).toEqual([]);
    });

    it("lists every open pull request in the Now section, each marked as in review", () => {
        for (const pr of openPRs) {
            expect(nowItems.some((i) => i.href === pr.url && i.status === "In review"), pr.url).toBe(true);
        }
    });

    it("never shows a pull request from the coursework repository, whatever the data holds", () => {
        for (const pr of [...mergedPRs, ...openPRs]) expect(pr.url.toLowerCase(), pr.url).not.toContain("scaler-adv-dbms");
    });

    it("dates the generated items", () => {
        expect(nowSyncedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
