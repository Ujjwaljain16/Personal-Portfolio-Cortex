import { describe, expect, it } from "vitest";
import { playbook } from "@/data/playbook";
import { records } from "@/data/records";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { buildCorpus, selectCorpus } from "@/lib/corpus";
import { buildSystemPrompt, NO_DATA_REPLY } from "@/lib/askPrompt";

describe("Digital Ujjwal: the playbook", () => {
    it("ties every principle to records that exist", () => {
        const ids = new Set(records.map((r) => r.id));
        expect(playbook.length).toBeGreaterThanOrEqual(5);
        for (const p of playbook) {
            expect(p.recordIds.length, p.title).toBeGreaterThan(0);
            for (const id of p.recordIds) expect(ids.has(id), `${p.title} -> ${id}`).toBe(true);
        }
    });

    it("is sent with every question, whatever it is about", () => {
        for (const q of ["How would you design a job queue?", "What is MiniDB?", "hello"]) {
            const text = selectCorpus(q).text;
            expect(text, q).toContain("HOW I APPROACH PROBLEMS");
            for (const p of playbook) expect(text, `${q}: ${p.title}`).toContain(p.title);
        }
        expect(buildCorpus()).toContain("HOW I APPROACH PROBLEMS");
    });

    it("says where I am and that none of it is employment", () => {
        const text = selectCorpus("Tell me about yourself").text;
        expect(text).toContain(profile.location);
        expect(text).toContain(profile.school);
        expect(text).toMatch(/no full-time industry employment/i);
    });

    it("knows which projects use a technology, even when the question names no project", () => {
        const text = selectCorpus("do u know react js?").text;
        expect(text).toContain("TECHNOLOGIES AND WHERE I USED THEM");
        const usesReact = projects.filter((p) => p.tech.some((t) => t.toLowerCase() === "react"));
        expect(usesReact.length).toBeGreaterThan(0);
        const line = text.split("\n").find((l) => l.startsWith("- React:"));
        expect(line, "a React line in the skills index").toBeDefined();
        for (const p of usesReact) expect(line, p.id).toContain(`[/projects/${p.id}]`);
    });

    it("adds the documented misses to hiring and weakness questions", () => {
        const sel = selectCorpus("What are your weaknesses?");
        const outcome = (id: string) => {
            const r = records.find((x) => x.id === id)!;
            return r.kind === "decision" ? r.status : r.verdict;
        };
        expect(sel.records.some((id) => !["adopted", "confirmed"].includes(outcome(id) ?? ""))).toBe(true);
    });
});

describe("Digital Ujjwal: the instructions", () => {
    const prompt = buildSystemPrompt(buildCorpus(), { kind: "none" });

    it("says it is an AI version, not me, and where to reach the real one", () => {
        expect(prompt).toMatch(/You are Digital Ujjwal/);
        expect(prompt).toMatch(/You are not him/);
        expect(prompt).toMatch(/email on the site/);
    });

    it("never turns project work into employment or invents a weakness", () => {
        expect(prompt).toMatch(/never describe any of it as professional employment/i);
        expect(prompt).toMatch(/never invent a personal weakness/i);
        expect(prompt).toMatch(/never call me a perfect fit/i);
    });

    it("allows reasoning about hypotheticals, but only labelled as such", () => {
        expect(prompt).toMatch(/whether I have built it or not/);
        expect(prompt).toMatch(/Never imply I have built or run something I have not/);
        expect(prompt).toContain(NO_DATA_REPLY);
    });
});

describe("Digital Ujjwal: citations in answers", () => {
    it("turns a bare bracketed path into a link only when it is a real page", async () => {
        const { linkBarePaths } = await import("@/components/ask/AskInterface");
        const allowed = new Set(["/investigations#real-one", "/projects/minidb"]);
        expect(linkBarePaths("see [/investigations#real-one].", allowed)).toBe("see [source](/investigations#real-one).");
        expect(linkBarePaths("see [/projects/made-up].", allowed)).toBe("see [/projects/made-up].");
        expect(linkBarePaths("already [MiniDB](/projects/minidb)", allowed)).toBe("already [MiniDB](/projects/minidb)");
    });
});
