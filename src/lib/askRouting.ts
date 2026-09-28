import { projects, alsoBuilt } from "@/data/projects";

/**
 * Works out which project a question is about, so the repository lookup asks about
 * that one repository instead of everything at once (faster, and more on target).
 */

interface AskProject {
    id: string;
    name: string;
    repo: string;
    aliases: string[];
}

const EXTRA_ALIASES: Record<string, string[]> = {
    "ecommerce-backend": ["ecommerce", "e commerce"],
    "bhttp-1": ["bhttp"],
};

/** "RecoveryOS" -> ["recoveryos", "recovery os"]; "SSE-Observatory" -> ["sse observatory", "sseobservatory"]. */
function aliasesFor(name: string, id: string, repo: string): string[] {
    const spaced = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[^A-Za-z0-9]+/g, " ").trim().toLowerCase();
    const squashed = (s: string) => s.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
    const repoName = repo.split("/")[1] ?? "";
    return [...new Set([spaced(name), squashed(name), spaced(id), spaced(repoName), squashed(repoName), ...(EXTRA_ALIASES[id] ?? [])])].filter((a) => a.length >= 3);
}

const ALL: AskProject[] = [
    ...projects.map((p) => ({ id: p.id, name: p.name, repo: p.repo, aliases: aliasesFor(p.name, p.id, p.repo) })),
    ...alsoBuilt.map((a) => ({ id: a.name.toLowerCase(), name: a.name, repo: a.repo, aliases: aliasesFor(a.name, a.name.toLowerCase(), a.repo) })),
    { id: "lexis", name: "LEXIS", repo: "Ujjwaljain16/LEXIS", aliases: ["lexis"] },
];

const normalise = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Projects named in the text, in the order they first appear. */
export function mentionedProjects(text: string): AskProject[] {
    const haystack = normalise(text);
    const found: { project: AskProject; at: number }[] = [];
    for (const project of ALL) {
        const positions = project.aliases.map((a) => haystack.indexOf(` ${a} `)).filter((i) => i >= 0);
        if (positions.length && !found.some((f) => f.project.repo === project.repo)) found.push({ project, at: Math.min(...positions) });
    }
    return found.sort((a, b) => a.at - b.at).map((f) => f.project);
}

const MAX_REPOS = 2;

export interface Pick {
    /** Projects the question is about (used to word the lookup). */
    projects: AskProject[];
    /** Repositories to look up: those projects' repos that are on the allowlist. */
    repos: string[];
}

/**
 * The current question decides; if it names no project (a follow-up such as "and what
 * was its limit?"), the earlier question does.
 */
export function pickRepos(question: string, previous: string | null, allowlist: readonly string[]): Pick {
    let named = mentionedProjects(question);
    if (named.length === 0 && previous) named = mentionedProjects(previous);
    const eligible = named.filter((p) => allowlist.includes(p.repo)).slice(0, MAX_REPOS);
    return { projects: eligible, repos: eligible.map((p) => p.repo) };
}

/** The question as the repository lookup should see it. */
export function buildWikiQuestion(question: string, picked: Pick): string {
    const about = picked.projects.map((p) => p.name).join(" and ");
    return `About ${about}: ${question}\nAnswer from the repository's code and documentation. Name the components and files involved, and any documented trade-offs, alternatives, benchmarks or known limitations. If the documentation makes a claim that the code does not back up, say so.`;
}
