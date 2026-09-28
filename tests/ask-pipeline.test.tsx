import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildCorpus, selectCorpus, validLinkPaths } from "@/lib/corpus";
import { pickRepos, buildWikiQuestion, mentionedProjects } from "@/lib/askRouting";
import { buildSystemPrompt, NO_DATA_REPLY } from "@/lib/askPrompt";
import { Markdown } from "@/components/Markdown";
import { projects } from "@/data/projects";
import { records } from "@/data/records";
import { BLOG_POSTS } from "@/data/blogPosts";
import { profile } from "@/data/profile";

const corpus = buildCorpus();
const ALLOW = ["Ujjwaljain16/RecoveryOS", "Ujjwaljain16/MiniDB", "Ujjwaljain16/VaultTabs", "Ujjwaljain16/SpentSmart", "Ujjwaljain16/SSE-Observatory"];

describe("corpus", () => {
    it("contains every project, record and post, each with its page path", () => {
        for (const p of projects) expect(corpus, p.id).toContain(`[/projects/${p.id}]`);
        for (const r of records) expect(corpus, r.id).toContain(`${r.id}: ${r.title} [/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}]`);
        for (const post of BLOG_POSTS) expect(corpus, post.slug).toContain(`[/blogs/${post.slug}]`);
    });

    it("carries the profile facts, so the assistant can answer them", () => {
        expect(corpus).toContain(profile.cgpa);
        expect(corpus).toContain(profile.school);
    });

    it("stays small enough to send whole with every question", () => {
        expect(corpus.length).toBeLessThan(400_000); // about 100k tokens
    });

    it("does not link to private repositories or carry local file paths", () => {
        expect(corpus).not.toMatch(/OSS-Hunter/i);
        expect(corpus).not.toMatch(/AppData|scratchpad|C:\\Users|D:\\Projects/);
    });

    it("exposes a valid link path for every citable item, and no duplicates", () => {
        const paths = validLinkPaths();
        expect(new Set(paths).size).toBe(paths.length);
        for (const r of records) expect(paths).toContain(`/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}`);
        for (const [path] of [...corpus.matchAll(/\[(\/[^\]\s]*)\]/g)].map((m) => [m[1]])) expect(paths, path).toContain(path);
    });
});

describe("routing", () => {
    it("finds projects by name, id or a spaced spelling", () => {
        expect(mentionedProjects("How does RecoveryOS work?").map((p) => p.id)).toEqual(["recoveryos"]);
        expect(mentionedProjects("tell me about recovery os").map((p) => p.id)).toEqual(["recoveryos"]);
        expect(mentionedProjects("what is sse observatory").map((p) => p.id)).toEqual(["sse-observatory"]);
        expect(mentionedProjects("Agent Brake policies").map((p) => p.id)).toEqual(["agentbrake"]);
    });

    it("does not match a project name inside another word", () => {
        expect(mentionedProjects("we refuzed the request")).toEqual([]);
        expect(mentionedProjects("How do you approach testing?")).toEqual([]);
    });

    it("orders projects by where they first appear and keeps at most two repositories", () => {
        const pick = pickRepos("Compare MiniDB, VaultTabs and RecoveryOS", null, ALLOW);
        expect(pick.repos).toEqual(["Ujjwaljain16/MiniDB", "Ujjwaljain16/VaultTabs"]);
    });

    it("only looks up repositories on the allowlist", () => {
        expect(pickRepos("What is AgentBrake?", null, ALLOW).repos).toEqual([]);
        expect(pickRepos("What is MiniDB?", null, ALLOW).repos).toEqual(["Ujjwaljain16/MiniDB"]);
    });

    it("falls back to the earlier question when a follow-up names nothing", () => {
        expect(pickRepos("and how are keys stored?", "Tell me about VaultTabs", ALLOW).repos).toEqual(["Ujjwaljain16/VaultTabs"]);
        // but the current question wins when it names a project itself
        expect(pickRepos("and MiniDB?", "Tell me about VaultTabs", ALLOW).repos).toEqual(["Ujjwaljain16/MiniDB"]);
    });

    it("rewords the question for the lookup service without dropping the visitor's words", () => {
        const pick = pickRepos("How does MiniDB recover?", null, ALLOW);
        const q = buildWikiQuestion("How does MiniDB recover?", pick);
        expect(q).toMatch(/^About MiniDB: How does MiniDB recover\?/);
        expect(q).toContain("documentation makes a claim");
    });
});

describe("system prompt", () => {
    it("says the verified portfolio wins over repository notes, and gives the exact no-data reply", () => {
        const prompt = buildSystemPrompt(corpus, { kind: "none" });
        expect(prompt).toContain("It is authoritative");
        expect(prompt).toContain("NOT checked");
        expect(prompt).toContain(NO_DATA_REPLY);
    });

    it("fences the repository notes as unchecked and puts them after the stable corpus", () => {
        const prompt = buildSystemPrompt(corpus, { kind: "used", repos: ["Ujjwaljain16/MiniDB"], text: "SOME NOTE" });
        expect(prompt).toContain("REPOSITORY NOTES (unchecked; from MiniDB)");
        expect(prompt.indexOf("END VERIFIED PORTFOLIO")).toBeLessThan(prompt.indexOf("SOME NOTE"));
    });

    it("starts the same way for every question, so the provider can reuse it", () => {
        const a = buildSystemPrompt(corpus, { kind: "none" });
        const b = buildSystemPrompt(corpus, { kind: "used", repos: ["Ujjwaljain16/MiniDB"], text: "x" });
        const shared = a.indexOf("=== END VERIFIED PORTFOLIO ===");
        expect(a.slice(0, shared)).toBe(b.slice(0, shared));
    });
});

describe("Markdown with allowed links", () => {
    const allowed = new Set(["/projects/minidb"]);
    const html = (md: string) => renderToStaticMarkup(<Markdown variant="chat" allowedLinks={allowed}>{md}</Markdown>);

    it("keeps links to known pages and to the author's GitHub", () => {
        expect(html("[MiniDB](/projects/minidb)")).toContain('href="/projects/minidb"');
        expect(html("[code](https://github.com/Ujjwaljain16/MiniDB)")).toContain('href="https://github.com/Ujjwaljain16/MiniDB"');
    });

    it("shows an invented page path, or a link elsewhere, as plain text", () => {
        const invented = html("[a made up page](/projects/does-not-exist)");
        expect(invented).not.toContain("<a");
        expect(invented).toContain("a made up page");
        expect(html("[x](https://evil.example.com/login)")).not.toContain("<a");
    });
});

describe("selecting what to send for a question", () => {
    it("always includes an index of every project, record and post with its page path", () => {
        const { text } = selectCorpus("How do you think about testing?");
        for (const p of projects) expect(text, p.id).toContain(`[/projects/${p.id}]`);
        for (const r of records) expect(text, r.id).toContain(`[/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}]`);
        for (const post of BLOG_POSTS) expect(text, post.slug).toContain(`[/blogs/${post.slug}]`);
    });

    it("gives full detail for a named project and all of its records", () => {
        const sel = selectCorpus("How does MiniDB recover after a crash?");
        expect(sel.projects).toContain("minidb");
        const minidbRecords = records.filter((r) => r.projectId === "minidb").map((r) => r.id);
        for (const id of minidbRecords.slice(0, 12)) expect(sel.records, id).toContain(id);
        expect(sel.text).toContain("## PROJECT minidb:");
        expect(sel.text).not.toContain("## PROJECT recoveryos:");
    });

    it("finds records by their words when no project is named", () => {
        const sel = selectCorpus("How do you approach vector search and recommendations?");
        const projectsOfChosen = sel.records.map((id) => records.find((r) => r.id === id)?.project);
        expect(projectsOfChosen).toContain("Fuze");
    });

    it("uses the earlier question when a follow-up names no project", () => {
        const sel = selectCorpus("and how are the keys stored?", "Tell me about VaultTabs");
        expect(sel.projects).toContain("vaulttabs");
    });

    it("adds the open-source list only when the question is about it", () => {
        expect(selectCorpus("Which pull requests are still open?").text).toContain("Open pull requests right now:");
        expect(selectCorpus("How does MiniDB recover after a crash?").text).not.toContain("Open pull requests right now:");
    });

    it("falls back to the strongest records for a question that matches nothing", () => {
        const sel = selectCorpus("zzzz qqqq");
        expect(sel.records.length).toBeGreaterThan(0);
        for (const id of sel.records) expect(records.find((r) => r.id === id)?.featured).toBe(true);
    });

    it("stays far smaller than the whole portfolio, and under a hard cap", () => {
        const full = buildCorpus().length;
        const questions = [
            "How does MiniDB recover after a crash?",
            "Compare RecoveryOS and FlashFlow",
            "How do you approach vector search and recommendations?",
            "What is the weather in Delhi?",
            "Tell me everything about your projects",
        ];
        for (const q of questions) {
            const { text } = selectCorpus(q);
            expect(text.length, q).toBeLessThan(full * 0.6);
            expect(text.length, q).toBeLessThan(160_000);
        }
    });
});
