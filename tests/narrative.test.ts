import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { records, getRecord } from "@/data/records";
import { diagrams } from "@/data/diagrams";
import { charts } from "@/data/charts";
import { nowItems, nowUpdated } from "@/data/now";
import { mergedPRs, openPRs } from "@/data/openSource";
import { takeaway } from "@/components/projects/RelatedRecords";
import { pageMetadata } from "@/lib/seo";

const projectIds = new Set(projects.map((p) => p.id));

describe("diagrams", () => {
    it("belong to real projects and have enough steps to be a diagram", () => {
        for (const [id, d] of Object.entries(diagrams)) {
            expect(projectIds.has(id), id).toBe(true);
            expect(d.steps.length, id).toBeGreaterThanOrEqual(3);
            expect(d.caption.length, id).toBeGreaterThan(20);
            const titles = d.steps.map((s) => s.title);
            expect(new Set(titles).size, `${id} duplicate step titles`).toBe(titles.length);
        }
    });
});

describe("charts", () => {
    it("are attached to records that exist", () => {
        for (const id of Object.keys(charts)) expect(getRecord(id), id).toBeDefined();
    });

    it("keep every value on the axis and say where the numbers came from", () => {
        for (const [id, list] of Object.entries(charts)) {
            for (const chart of list) {
                expect(chart.source.length, `${id}: source`).toBeGreaterThan(10);
                for (const ref of chart.refs ?? []) expect(ref.value, `${id}: ref`).toBeLessThanOrEqual(chart.max);
                if (chart.kind === "bars") {
                    for (const row of chart.rows) {
                        expect(row.value, `${id}: ${row.label}`).toBeGreaterThan(0);
                        expect(row.value, `${id}: ${row.label}`).toBeLessThanOrEqual(chart.max);
                    }
                } else {
                    for (const row of chart.rows) {
                        expect(row.min, `${id}: ${row.label}`).toBeLessThanOrEqual(row.max);
                        expect(row.max, `${id}: ${row.label}`).toBeLessThanOrEqual(chart.max);
                        for (const p of row.points ?? []) {
                            expect(p, `${id}: ${row.label} point`).toBeGreaterThanOrEqual(row.min);
                            expect(p, `${id}: ${row.label} point`).toBeLessThanOrEqual(row.max);
                        }
                    }
                }
            }
        }
    });
});

describe("next steps", () => {
    it("belong to real projects and are complete sentences", () => {
        for (const p of projects) {
            for (const step of p.next ?? []) expect(step, `${p.id}`).toMatch(/[.]$/);
        }
    });
});

describe("Now section", () => {
    it("has a valid review date and links that resolve", () => {
        expect(nowUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(nowItems.length).toBeGreaterThan(0);
        for (const item of nowItems) {
            if (!item.href || /^https:\/\//.test(item.href)) continue;
            const [path, anchor] = item.href.split("#");
            if (path.startsWith("/projects/")) expect(projectIds.has(path.split("/")[2]), item.href).toBe(true);
            if (anchor) expect(getRecord(anchor), item.href).toBeDefined();
        }
    });
});

describe("takeaway", () => {
    it("returns one short sentence for every record", () => {
        for (const r of records) {
            const t = takeaway(r);
            expect(t.length, r.id).toBeGreaterThan(10);
            expect(t.length, r.id).toBeLessThanOrEqual(221);
        }
    });
});

describe("pageMetadata with its own image", () => {
    it("leaves the image out so the route's opengraph-image is used", () => {
        const meta = pageMetadata({ title: "X", description: "d", path: "/x", ownImage: true });
        expect(meta.openGraph).not.toHaveProperty("images");
        expect(meta.twitter).not.toHaveProperty("images");
    });
});

describe("Now section and open pull requests", () => {
    it("lists every open pull request from the open-source data", () => {
        for (const pr of openPRs) expect(nowItems.some((i) => i.href === pr.url), pr.url).toBe(true);
    });

    it("links only to public places: no private repositories", () => {
        for (const item of nowItems) expect(item.href ?? "", item.text).not.toMatch(/OSS-Hunter/i);
    });

    it("keeps open pull requests distinct from merged ones", () => {
        const merged = new Set(mergedPRs.map((p) => p.url));
        for (const pr of openPRs) expect(merged.has(pr.url), pr.url).toBe(false);
    });
});
