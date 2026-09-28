import "server-only";
import { projects, alsoBuilt } from "@/data/projects";
import { records } from "@/data/records";
import { BLOG_POSTS } from "@/data/blogPosts";
import { mergedPRs, openPRs } from "@/data/openSource";
import { deployments } from "@/data/deployments";
import { nowItems, nowUpdated } from "@/data/now";
import { profile } from "@/data/profile";
import { mentionedProjects } from "@/lib/askRouting";
import type { EngineeringRecord } from "@/data/records";

/**
 * The portfolio's verified content, as text for the model.
 *
 * Every answer gets a compact INDEX of everything (titles, outcomes and page paths, so the
 * model always knows what exists and where to point), plus full DETAIL for the parts the
 * question is about: the projects it names, their records, and the best keyword matches.
 * Sending the whole site with every question (about 60k tokens) worked but used up the
 * model's per-minute quota in a few questions; this is about a quarter of that.
 *
 * Links and evidence URLs are left out on purpose: the page paths are enough to cite.
 */

const list = (items: string[], prefix = "- ") => items.map((i) => `${prefix}${i}`).join("\n");
const recordPath = (r: EngineeringRecord) => `/${r.kind === "decision" ? "decisions" : "investigations"}#${r.id}`;

function projectBlock(p: (typeof projects)[number]): string {
    const related = records.filter((r) => r.projectId === p.id).map((r) => r.id);
    return [
        `## PROJECT ${p.id}: ${p.name} [/projects/${p.id}]`,
        `Status: ${p.status}. Origin: ${p.origin}. Period: ${p.period}.`,
        `Summary: ${p.tagline}`,
        `Problem: ${p.problem}`,
        `How it works:\n${list(p.approach)}`,
        `Evidence:\n${list(p.evidence.map((e) => e.text))}`,
        `What is not done:\n${list(p.limitations)}`,
        p.next?.length ? `Next steps (from the gaps above, not promises):\n${list(p.next)}` : "",
        `Repository: ${p.repo}. Stack: ${p.tech.join(", ")}.`,
        related.length ? `Related records: ${related.join(", ")}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

function recordBlock(r: EngineeringRecord): string {
    const outcome = r.kind === "decision" ? r.status : r.verdict;
    const head = `## ${r.kind.toUpperCase()} ${r.id}: ${r.title} [${recordPath(r)}]`;
    const meta = `Project: ${r.project}. Date: ${r.date}. Outcome: ${outcome}. Reasoning was ${r.provenance === "recorded" ? "written down at the time" : "reconstructed from history"}.`;
    const body =
        r.kind === "decision"
            ? [
                  `Context: ${r.context}`,
                  `Decision: ${r.decision}`,
                  r.alternatives?.length ? `Alternatives:\n${list(r.alternatives.map((a) => `${a.option}: ${a.whyNot}`))}` : "",
                  `What happened: ${r.consequences}`,
              ]
            : [
                  `Question: ${r.question}`,
                  `Method: ${r.method}`,
                  `Result: ${r.result}`,
                  r.numbers?.length ? `Numbers:\n${list(r.numbers.map((n) => `${n.label} = ${n.value}`))}` : "",
              ];
    return [head, meta, ...body, `How it was checked: ${r.verification}`].filter(Boolean).join("\n");
}

function postBlock(post: (typeof BLOG_POSTS)[number]): string {
    return [
        `## POST ${post.slug}: ${post.title} [/blogs/${post.slug}]`,
        `Published ${post.published}${post.updated ? `, updated ${post.updated}` : ""}. Tags: ${post.tags.join(", ")}.`,
        post.content.trim(),
    ].join("\n");
}

const aboutBlock = () =>
    [
        "## ABOUT",
        `${profile.name}. ${profile.role}.`,
        `Education: ${profile.degree}, ${profile.school}, ${profile.years}. CGPA ${profile.cgpa}.`,
        "Everything below was checked against the source repositories. Things that are unfinished, unmeasured or later found to be wrong are stated as such.",
    ].join("\n");

const smallerBlock = () => (alsoBuilt.length ? ["## SMALLER PROJECTS", list(alsoBuilt.map((a) => `${a.name} (${a.repo}): ${a.line}`))].join("\n") : "");

const openSourceBlock = () =>
    [
        "## OPEN SOURCE [/]",
        "Merged pull requests:",
        list(mergedPRs.map((p) => `${p.project} #${p.number} (${p.merged}): ${p.title}. ${p.summary}`)),
        "Open pull requests right now:",
        list(openPRs.map((p) => `${p.project} #${p.number}: ${p.title}. ${p.note}`)),
    ].join("\n");

const deploymentsBlock = () =>
    ["## WHERE THINGS RUN [/deployments]", list(deployments.map((d) => `${d.repo}: ${d.summary}. ${d.impact}${d.liveUrl ? ` Live: ${d.liveUrl}` : ""}`))].join("\n");

const nowBlock = () => [`## NOW (reviewed ${nowUpdated}) [/]`, list(nowItems.map((n) => `${n.status}: ${n.text}`))].join("\n");

/** One line per item: enough to know it exists, what it concluded, and where to link. */
function indexBlock(): string {
    const outcome = (r: EngineeringRecord) => (r.kind === "decision" ? r.status : r.verdict);
    return [
        "## INDEX OF EVERYTHING (cite with the path in brackets; full detail follows only for the items most relevant to this question)",
        "Projects:",
        list(projects.map((p) => `${p.name}, ${p.status}: ${p.tagline} [/projects/${p.id}]`)),
        "Decisions and investigations:",
        list(records.map((r) => `${r.project} (${r.kind}, ${outcome(r)}): ${r.title} [${recordPath(r)}]`)),
        "Posts:",
        list(BLOG_POSTS.map((p) => `${p.title} [/blogs/${p.slug}]`)),
    ].join("\n");
}

// ─── The whole thing, for tests and size checks ──────────────────────────────

export function buildCorpus(): string {
    return [
        aboutBlock(),
        ...projects.map(projectBlock),
        smallerBlock(),
        ...records.map(recordBlock),
        ...BLOG_POSTS.map(postBlock),
        openSourceBlock(),
        deploymentsBlock(),
        nowBlock(),
    ]
        .filter(Boolean)
        .join("\n\n");
}

// ─── Choosing what to send for one question ──────────────────────────────────

const STOP = new Set(
    "the and for with that this what how why did does you your are was were have has had can could would should about from into over than then them they their there which who whom whose when where while will just also very much more most some any all not but its it's out off get got use used using make made way ways tell me my i we our us please explain describe give show".split(" ")
);

const words = (text: string): string[] => [...new Set(text.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length >= 3 && !STOP.has(w)))];

const MAX_NAMED_RECORDS = 12;
const MAX_MATCHED_RECORDS = 6;
const MAX_DETAIL_CHARS = 110_000; // about 27k tokens

interface Pieces {
    projectText: Map<string, { text: string; lower: string }>;
    recordItems: { record: EngineeringRecord; text: string; head: string; lower: string }[];
    postItems: { post: (typeof BLOG_POSTS)[number]; text: string; head: string }[];
    index: string;
    about: string;
    smaller: string;
}

let cachedPieces: Pieces | undefined;
function pieces(): Pieces {
    return (cachedPieces ??= {
        projectText: new Map(projects.map((p) => [p.id, { text: projectBlock(p), lower: projectBlock(p).toLowerCase() }])),
        recordItems: records.map((r) => {
            const text = recordBlock(r);
            return { record: r, text, head: `${r.title} ${r.project} ${r.id}`.toLowerCase(), lower: text.toLowerCase() };
        }),
        postItems: BLOG_POSTS.map((post) => ({ post, text: postBlock(post), head: `${post.title} ${post.tags.join(" ")}`.toLowerCase() })),
        index: indexBlock(),
        about: aboutBlock(),
        smaller: smallerBlock(),
    });
}

/** How well a piece of text matches the question's words: title hits count more than body hits. */
function score(terms: string[], head: string, body: string): number {
    let s = 0;
    for (const t of terms) {
        if (head.includes(t)) s += 3;
        else if (body.includes(t)) s += 1;
    }
    return s;
}

export interface Selection {
    text: string;
    projects: string[];
    records: string[];
    posts: string[];
}

/**
 * Builds the portfolio text for one question. The current question decides; a follow-up
 * that names nothing borrows from the earlier question.
 */
export function selectCorpus(question: string, previous: string | null = null): Selection {
    const p = pieces();
    let named = mentionedProjects(question);
    let terms = words(question);
    if (named.length === 0 && previous) {
        named = mentionedProjects(previous);
        terms = [...new Set([...terms, ...words(previous)])];
    }
    const namedIds = new Set(named.map((n) => n.id).filter((id) => p.projectText.has(id)));
    const asked = ` ${question.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;

    // Projects: the ones named, then the best matches.
    const projectIds = [...namedIds];
    const projectScores = [...p.projectText.entries()]
        .filter(([id]) => !namedIds.has(id))
        .map(([id, t]) => ({ id, s: score(terms, id, t.lower) }))
        .filter((x) => x.s >= 4)
        .sort((a, b) => b.s - a.s);
    for (const x of projectScores) if (projectIds.length < 3) projectIds.push(x.id);

    // Records: everything for a named project, then the best matches elsewhere.
    const ranked = p.recordItems.map((item) => ({ item, s: score(terms, item.head, item.lower), named: !!item.record.projectId && namedIds.has(item.record.projectId) }));
    const namedRecords = ranked.filter((r) => r.named).sort((a, b) => b.s - a.s).slice(0, MAX_NAMED_RECORDS);
    const matched = ranked.filter((r) => !r.named && r.s >= 4).sort((a, b) => b.s - a.s).slice(0, MAX_MATCHED_RECORDS);
    let chosen = [...namedRecords, ...matched];
    // A general question that matches nothing: lead with the strongest records so there is something to answer from.
    if (chosen.length === 0) chosen = ranked.filter((r) => r.item.record.featured).slice(0, MAX_MATCHED_RECORDS);

    // Posts: only a clear match.
    const post = p.postItems.map((x) => ({ x, s: score(terms, x.head, "") })).filter((x) => x.s >= 4).sort((a, b) => b.s - a.s)[0]?.x;

    const wantsOpenSource = /open.?source|pull request|superset|vitest|appwrite|contribut|merged/.test(asked) || asked.includes(" pr ") || asked.includes(" prs ");
    const wantsDeploy = /deploy|published|npm|hosted|release|live demo|where .* run/.test(asked);
    const wantsNow = /right now|currently|working on|latest|recent|these days|at the moment/.test(asked);

    const detail: string[] = [];
    let size = 0;
    const add = (text: string) => {
        if (text && size + text.length <= MAX_DETAIL_CHARS) {
            detail.push(text);
            size += text.length;
        }
    };
    for (const id of projectIds) add(p.projectText.get(id)?.text ?? "");
    const includedRecords: string[] = [];
    for (const r of chosen) {
        const before = size;
        add(r.item.text);
        if (size > before) includedRecords.push(r.item.record.id);
    }
    if (post) add(post.text);
    if (wantsOpenSource) add(openSourceBlock());
    if (wantsDeploy) add(deploymentsBlock());
    if (wantsNow) add(nowBlock());
    if (named.length === 0 && projectIds.length === 0) add(p.smaller);

    const text = [p.about, p.index, "## DETAIL (the parts most relevant to this question)", ...detail].filter(Boolean).join("\n\n");
    return { text, projects: projectIds, records: includedRecords, posts: post ? [post.post.slug] : [] };
}

/** Every page path the assistant may link to. Anything else in an answer is shown as plain text. */
export function validLinkPaths(): string[] {
    return [
        "/",
        "/projects",
        "/decisions",
        "/investigations",
        "/deployments",
        "/blogs",
        "/system",
        "/ask",
        ...projects.map((p) => `/projects/${p.id}`),
        ...records.map(recordPath),
        ...BLOG_POSTS.map((p) => `/blogs/${p.slug}`),
    ];
}
