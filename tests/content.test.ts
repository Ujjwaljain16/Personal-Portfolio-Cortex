import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projects, featuredProjects, alsoBuilt, getProject } from "@/data/projects";
import { records, decisions, investigations, getRecord } from "@/data/records";
import { deployments } from "@/data/deployments";
import { BLOG_POSTS } from "@/data/blogPosts";
import { buildSearchIndex } from "@/lib/searchIndex";

const publicDir = join(process.cwd(), "public");

describe("projects", () => {
    it("have unique ids and a repository", () => {
        const ids = projects.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const p of projects) expect(p.repo).toMatch(/^[\w.-]+\/[\w.-]+$/);
    });

    it("state limitations and evidence, not just claims", () => {
        for (const p of projects) {
            expect(p.limitations.length, `${p.id} limitations`).toBeGreaterThan(0);
            expect(p.evidence.length, `${p.id} evidence`).toBeGreaterThan(0);
        }
    });

    it("reference screenshots that exist and have alt text", () => {
        for (const p of projects) {
            for (const img of p.gallery?.items ?? []) {
                expect(existsSync(join(publicDir, img.src)), `${p.id}: ${img.src}`).toBe(true);
                expect(img.alt.length).toBeGreaterThan(20);
            }
        }
    });

    it("has featured projects to show", () => {
        expect(featuredProjects.length).toBeGreaterThan(0);
    });

    it("TypeAheadX has its own page, and its records point back at it", () => {
        const p = getProject("typeaheadx");
        expect(p).toBeDefined();
        expect(p?.tier).toBe("more");
        const related = records.filter((r) => r.project === "TypeAheadX");
        expect(related.length).toBeGreaterThan(0);
        for (const r of related) expect(r.projectId, r.id).toBe("typeaheadx");
    });

    it("Lexis AI moved to Also built, is not a project id, and its records no longer link to a page", () => {
        expect(getProject("lexis-ai")).toBeUndefined();
        expect(projects.some((p) => p.name === "Lexis AI")).toBe(false);
        expect(alsoBuilt.some((a) => a.name === "Lexis AI")).toBe(true);
        const related = records.filter((r) => r.project === "Lexis AI");
        expect(related.length).toBeGreaterThan(0);
        for (const r of related) expect(r.projectId, r.id).toBeUndefined();
    });

    it("every alsoBuilt entry names a project that is not also a full page", () => {
        const ids = new Set(projects.map((p) => p.id));
        for (const a of alsoBuilt) expect(ids.has(a.name.toLowerCase()), a.name).toBe(false);
    });
});

describe("records", () => {
    it("have unique ids and are split into decisions and investigations", () => {
        const ids = records.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(decisions.length + investigations.length).toBe(records.length);
    });

    it("each cite at least two pieces of evidence with a note, and say how they were checked", () => {
        for (const r of records) {
            expect(r.evidence.length, r.id).toBeGreaterThanOrEqual(2);
            for (const e of r.evidence) expect(e.note.length, `${r.id} evidence note`).toBeGreaterThan(5);
            expect(r.verification.length, `${r.id} verification`).toBeGreaterThan(20);
        }
    });

    it("only link evidence to public GitHub or npm pages", () => {
        for (const r of records) {
            for (const e of r.evidence) {
                if (!e.href) continue;
                expect(e.href, `${r.id}`).toMatch(/^https:\/\/(github\.com\/|unpkg\.com\/@ujjwaljain16\/migratedb@|registry\.npmjs\.org\/@ujjwaljain16)/);
            }
        }
    });

    it("contain no local file paths or first-person process notes", () => {
        for (const r of records) {
            const text = JSON.stringify(r);
            expect(text, r.id).not.toMatch(/AppData|scratchpad|C:\\\\Users|D:\\\\Projects/);
        }
    });

    it("point at project pages that exist", () => {
        const ids = new Set(projects.map((p) => p.id));
        for (const r of records) if (r.projectId) expect(ids.has(r.projectId), `${r.id} -> ${r.projectId}`).toBe(true);
    });

    it("investigations have a method, a result and a verdict", () => {
        for (const r of investigations) {
            expect(r.method, r.id).toBeTruthy();
            expect(r.result, r.id).toBeTruthy();
            expect(r.verdict, r.id).toBeTruthy();
        }
    });
});

describe("cross references", () => {
    it("deployments only relate to records that exist", () => {
        for (const d of deployments) for (const id of d.relatedRecordIds ?? []) expect(getRecord(id), `${d.id} -> ${id}`).toBeDefined();
    });

    it("blog posts have unique slugs and ISO dates", () => {
        const slugs = BLOG_POSTS.map((p) => p.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const p of BLOG_POSTS) expect(p.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("a migrated post points at a real Medium story under this account", () => {
        for (const p of BLOG_POSTS.filter((p) => p.migratedTo)) {
            expect(p.migratedTo, p.slug).toMatch(/^https:\/\/medium\.com\/@jainujjwal1609\//);
            expect(p.migratedTo, p.slug).not.toMatch(/[?&]source=/); // tracking params stripped
        }
    });
});

describe("search index", () => {
    const index = buildSearchIndex();

    it("has unique ids", () => {
        expect(new Set(index.map((e) => e.id)).size).toBe(index.length);
    });

    it("covers every project, post and record", () => {
        expect(index.length).toBe(projects.length + BLOG_POSTS.length + records.length);
    });

    it("sends a migrated post straight to Medium instead of the page that just redirects", () => {
        for (const p of BLOG_POSTS.filter((p) => p.migratedTo)) {
            const entry = index.find((e) => e.id === `post-${p.slug}`);
            expect(entry?.href, p.slug).toBe(p.migratedTo);
        }
    });

    it("links records to an anchor that exists on their page", () => {
        for (const e of index.filter((x) => x.category === "Decisions" || x.category === "Investigations")) {
            const [path, id] = e.href.split("#");
            const rec = getRecord(id);
            expect(rec, e.href).toBeDefined();
            expect(path).toBe(rec!.kind === "decision" ? "/decisions" : "/investigations");
        }
    });

    it("does not carry full record or post text into the client", () => {
        const size = JSON.stringify(index).length;
        expect(size).toBeLessThan(40_000);
    });
});

describe("sitemap", () => {
    it("does not list a post that redirects away to Medium", async () => {
        const { default: sitemap } = await import("@/app/sitemap");
        const urls = sitemap().map((e) => e.url);
        for (const p of BLOG_POSTS.filter((p) => p.migratedTo)) expect(urls, p.slug).not.toContain(`https://ujjwaljain.vercel.app/blogs/${p.slug}`);
        for (const p of BLOG_POSTS.filter((p) => !p.migratedTo)) expect(urls, p.slug).toContain(`https://ujjwaljain.vercel.app/blogs/${p.slug}`);
    });
});
