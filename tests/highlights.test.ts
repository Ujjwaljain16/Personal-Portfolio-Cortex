import { describe, expect, it } from "vitest";
import { highlights } from "@/data/highlights";
import { featuredProjects, getProject } from "@/data/projects";
import { getRecord } from "@/data/records";

describe("home page proof numbers", () => {
    it("each links to a record or project page that holds it, or to a section of the home page", () => {
        expect(highlights.length).toBeGreaterThanOrEqual(3);
        for (const h of highlights) {
            const [path, anchor] = h.href.split("#");
            if (path === "/") {
                expect(anchor, h.label).toBeTruthy();
                continue;
            }
            if (path.startsWith("/projects/")) {
                const p = getProject(path.slice("/projects/".length));
                expect(p, h.href).toBeDefined();
                expect(h.value, h.href).toBe(p!.headline?.value);
                continue;
            }
            expect(["/decisions", "/investigations"], h.href).toContain(path);
            const r = getRecord(anchor);
            expect(r, h.href).toBeDefined();
            expect(path, h.href).toBe(r!.kind === "decision" ? "/decisions" : "/investigations");
        }
    });

    it("every featured project has a headline number with its context", () => {
        for (const p of featuredProjects) {
            expect(p.headline, p.id).toBeDefined();
            expect(p.headline!.value.length, p.id).toBeGreaterThan(0);
            expect(p.headline!.label.length, p.id).toBeGreaterThan(20);
        }
    });
});
