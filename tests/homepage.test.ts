import { describe, expect, it } from "vitest";
import { AREAS, getProject, projects } from "@/data/projects";
import { PROJECT_LOGOS } from "@/data/projectLogos";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { records } from "@/data/records";
import { aboutMe } from "@/data/about";
import { orderRecords } from "@/lib/recordsOrder";

describe("project periods", () => {
    it("use one format: month and year, an optional range, an optional detail after a middle dot", () => {
        const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
        const DATE = `${MONTH} \\d{4}`;
        const re = new RegExp(`^${DATE}( – (${DATE}|present))?( · .+)?$`);
        for (const p of projects) expect(p.period, p.id).toMatch(re);
    });
});

describe("project areas", () => {
    it("gives every project one or two known areas, without repeats", () => {
        const known = new Set(AREAS.map((a) => a.id));
        for (const p of projects) {
            expect(p.areas.length, p.id).toBeGreaterThanOrEqual(1);
            expect(p.areas.length, p.id).toBeLessThanOrEqual(2);
            expect(new Set(p.areas).size, p.id).toBe(p.areas.length);
            for (const a of p.areas) expect(known.has(a), `${p.id}: ${a}`).toBe(true);
        }
    });

    it("lists only areas some project uses", () => {
        for (const a of AREAS) expect(projects.some((p) => p.areas.includes(a.id)), a.id).toBe(true);
    });
});

describe("project logos", () => {
    it("belong to real projects and exist under public/", () => {
        for (const [id, logo] of Object.entries(PROJECT_LOGOS)) {
            expect(getProject(id), id).toBeDefined();
            expect(existsSync(join(process.cwd(), "public", logo.src)), logo.src).toBe(true);
        }
    });
});

describe("records order", () => {
    it("lists featured records first, then newest first, and drops nothing", () => {
        const ordered = orderRecords(records);
        expect(ordered.length).toBe(records.length);
        const firstNotFeatured = ordered.findIndex((r) => !r.featured);
        expect(ordered.slice(firstNotFeatured).some((r) => r.featured)).toBe(false);
        for (const group of [ordered.slice(0, firstNotFeatured), ordered.slice(firstNotFeatured)]) {
            const dates = group.map((r) => r.date);
            expect(dates).toEqual([...dates].sort().reverse());
        }
    });
});

describe("about me", () => {
    it("has no placeholder text in production", () => {
        for (const f of aboutMe) expect(f.text).not.toMatch(/PLACEHOLDER/);
    });
});

describe("featured records", () => {
    it("stay few enough to mean something", () => {
        for (const kind of ["investigation", "decision"] as const) {
            const featured = records.filter((r) => r.kind === kind && r.featured);
            expect(featured.length, kind).toBeGreaterThanOrEqual(6);
            expect(featured.length, kind).toBeLessThanOrEqual(12);
        }
    });
});
