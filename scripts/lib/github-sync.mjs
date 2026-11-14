// Pure helpers for scripts/sync-github.mjs, kept free of I/O so tests can import them.
//
// What this decides, and why:
//  - Which pull requests count as open-source contributions: authored by the owner, public, in a repository the
//    owner does not own, and in a project with at least MIN_STARS stars. The star floor keeps course and team
//    repositories out without anyone having to remember to exclude them; DENY_REPOS is the explicit second lock.
//  - What the site says about each one: only the pull request's own title and its own description. Nothing is
//    summarised by a model, so there is nothing to hallucinate. A hand-written summary in src/data/openSource.ts
//    always wins over the extracted one.

export const OWNER = "Ujjwaljain16";
/** Contributions to projects with fewer stars than this are not listed. */
export const MIN_STARS = 20;
/** Open pull requests with no activity for this many days are treated as abandoned and not listed. */
export const OPEN_FRESH_DAYS = 60;
/** Lower-case `owner/name`. Never listed, whatever their star count. */
export const DENY_REPOS = new Set(["knightknight27/scaler-adv-dbms"]);

/** Display names; anything not listed falls back to the repository name in Title Case. */
export const PROJECT_NAMES = {
    "apache/superset": "Apache Superset",
    "vitest-dev/vitest": "Vitest",
    "appwrite/appwrite": "Appwrite",
    "metacoglabs/hypergraph": "Metacog Hypergraph",
    "kubernetes-sigs/gateway-api": "Kubernetes Gateway API",
    "googlechrome/workbox": "Workbox",
    "temporalio/temporal": "Temporal",
};

/** 3048 -> "3k", 75523 -> "75k", 29 -> "29". Rounded down on purpose: the site says "approximate". */
export function formatStars(n) {
    return n >= 1000 ? `${Math.floor(n / 1000)}k` : String(n);
}

const CONVENTIONAL = /^(fix|feat|chore|docs|refactor|test|tests|perf|ci|build|style|revert)(\([^)]*\))?!?:\s*/i;

/** "fix(ci): fall back to ..." -> "Fall back to ...". Titles without a prefix are left alone. */
export function cleanTitle(title) {
    const t = title.replace(CONVENTIONAL, "").trim();
    return /^[a-z]+\b/.test(t) && /^[a-z]+$/.test(t.split(/\s/)[0]) ? t[0].toUpperCase() + t.slice(1) : t;
}

export function projectName(nameWithOwner) {
    const known = PROJECT_NAMES[nameWithOwner.toLowerCase()];
    if (known) return known;
    return nameWithOwner
        .split("/")[1]
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

// Lines that are template scaffolding or bookkeeping rather than a description.
const SKIP_LINE = [
    /^(fixes|closes|resolves|related to|refs?|see)\b.*#\d+\.?$/i,
    /^\/[a-z-]+/, // prow commands such as /kind bug
    /^what type of pr/i,
    /^(which issue|special notes|does this pr|release note|checklist|before|after|testing|test plan|how was this)/i,
    /^[-*]\s*\[[ xX]\]/,
    /^<!--/,
    /^(none|n\/a)\.?$/i,
];
// A heading that says the description starts on the next line.
const MARKER = /^(what this pr does.*|description|summary|overview|what changed\??|purpose|why\??)\s*:?\s*$/i;
// Personal details that belong to coursework or team repositories; a body with any of these is never used.
const PRIVATE = [/[\w.+-]+@[\w-]+\.[\w.]+/, /\broll\s*(no|number)\b/i, /\bteam name\b/i];

/** First real paragraph of a pull request description, trimmed to about two sentences; "" when there is none. */
export function summaryFromBody(body) {
    if (!body || PRIVATE.some((re) => re.test(body))) return "";
    const lines = body
        .replace(/\r/g, "")
        .split("\n")
        .map((l) => l.trim());
    const marker = lines.findIndex((l) => MARKER.test(l));
    const candidates = lines.slice(marker >= 0 ? marker + 1 : 0).filter((l) => l && !SKIP_LINE.some((re) => re.test(l)) && !MARKER.test(l));
    const first = candidates.find((l) => l.length >= 40);
    if (!first) return "";
    let text = first.replace(/\s+/g, " ");
    if (text.length > 300) {
        const sentence = text.slice(0, 300).match(/^[\s\S]*[.!?](?=\s)/);
        text = sentence && sentence[0].length > 80 ? sentence[0] : `${text.slice(0, 280).replace(/\s+\S*$/, "")}…`;
    }
    if (/^[a-z]+$/.test(text.split(/\s/)[0])) text = text[0].toUpperCase() + text.slice(1);
    return text;
}

const DAY = 86_400_000;
const date = (iso) => iso.slice(0, 10);

function reviewNote(pr) {
    const decision = { APPROVED: "Approved, waiting to merge.", CHANGES_REQUESTED: "Changes requested." }[pr.reviewDecision];
    return `Opened ${date(pr.createdAt)}, last activity ${date(pr.updatedAt)}. ${decision ?? "Waiting for review."}`;
}

/**
 * Turns the GraphQL nodes into the two lists the site shows. `now` is a Date so tests can fix it.
 * Merged: newest first. Open: only fresh, non-draft pull requests.
 */
export function normalize(nodes, now = new Date()) {
    const merged = [];
    const open = [];
    for (const n of nodes) {
        const repo = n.repository;
        const full = repo.nameWithOwner;
        if (repo.owner.login.toLowerCase() === OWNER.toLowerCase() || repo.isPrivate) continue;
        if (DENY_REPOS.has(full.toLowerCase()) || repo.stargazerCount < MIN_STARS) continue;
        const base = {
            repo: full,
            project: projectName(full),
            stars: formatStars(repo.stargazerCount),
            number: n.number,
            title: cleanTitle(n.title),
            url: n.url,
        };
        if (n.state === "MERGED" && n.mergedAt) {
            merged.push({ ...base, merged: date(n.mergedAt), summary: summaryFromBody(n.bodyText) });
        } else if (n.state === "OPEN" && !n.isDraft && now - new Date(n.updatedAt) <= OPEN_FRESH_DAYS * DAY) {
            open.push({ ...base, note: reviewNote(n) });
        }
    }
    merged.sort((a, b) => b.merged.localeCompare(a.merged) || b.number - a.number);
    open.sort((a, b) => b.number - a.number);
    return { merged, open };
}

/** Stable text so an unchanged result produces a byte-identical file and therefore no commit. */
export function render(data) {
    return `${JSON.stringify(data, null, 4)}\n`;
}
