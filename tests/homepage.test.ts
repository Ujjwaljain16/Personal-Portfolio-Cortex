import { describe, expect, it } from "vitest";
import { startHere } from "@/data/startHere";
import { featuredProjects, getProject, projects } from "@/data/projects";
import { getRecord, records } from "@/data/records";
import { aboutMe } from "@/data/about";
import { orderRecords } from "@/lib/recordsOrder";

describe("start here", () => {
    it("names real projects and real records, and links each record back to its project", () => {
        expect(startHere.length).toBe(3);
        for (const item of startHere) {
            const project = getProject(item.projectId);
            expect(project, item.projectId).toBeDefined();
            expect(item.claim.length, item.projectId).toBeGreaterThan(40);
            expect(item.links.length, item.projectId).toBeGreaterThan(0);
            for (const l of item.links) {
                const r = getRecord(l.recordId);
                expect(r, l.recordId).toBeDefined();
                expect(r?.projectId, l.recordId).toBe(item.projectId);
            }
        }
    });

    it("features each of its projects, in the grid before any other project", () => {
        const ids = featuredProjects.map((p) => p.id);
        expect(ids.slice(0, startHere.length)).toEqual(startHere.map((s) => s.projectId));
    });
});

describe("project periods", () => {
    it("use one format: month and year, an optional range, an optional detail after a middle dot", () => {
        const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
        const DATE = `${MONTH} \\d{4}`;
        const re = new RegExp(`^${DATE}( – (${DATE}|present))?( · .+)?$`);
        for (const p of projects) expect(p.period, p.id).toMatch(re);
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
    it("stay few enough to mean something, and include everything the home page points at", () => {
        for (const kind of ["investigation", "decision"] as const) {
            const featured = records.filter((r) => r.kind === kind && r.featured);
            expect(featured.length, kind).toBeGreaterThanOrEqual(6);
            expect(featured.length, kind).toBeLessThanOrEqual(12);
        }
        for (const item of startHere) for (const l of item.links) expect(getRecord(l.recordId)?.featured, l.recordId).toBe(true);
    });
});
