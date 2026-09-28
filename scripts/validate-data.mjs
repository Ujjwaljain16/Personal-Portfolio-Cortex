// Lightweight integrity checks for the static portfolio data in src/data.
//
//   npm run validate:data            errors fail (exit 1); warnings are printed
//   npm run validate:data -- --strict   warnings fail too
//
// ERRORS cover everything the site presents as verified: projects, open source,
// deployments, blog posts and the decision/investigation records. WARNINGS are
// reserved for softer checks (currently none).
//
// Runs on plain Node (>= 22.18): the data modules are import-free TypeScript, so
// Node strips the types itself and no extra tooling is needed.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const { projects, alsoBuilt } = await import("../src/data/projects.ts");
const { mergedPRs, inReview } = await import("../src/data/openSource.ts");
const { deployments } = await import("../src/data/deployments.ts");
const { BLOG_POSTS } = await import("../src/data/blogPosts.ts");
const { records } = await import("../src/data/records.ts");

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function unique(list, key, where, report = err) {
    const seen = new Set();
    for (const item of list) {
        const k = item[key];
        if (seen.has(k)) report(where, `duplicate ${key} "${k}"`);
        seen.add(k);
    }
}

// ─── Projects ────────────────────────────────────────────────
unique(projects, "id", "projects");
unique(projects, "name", "projects");
const TIERS = new Set(["flagship", "more"]);
const STATUSES = new Set(["ongoing", "shipped", "prototype", "in-progress"]);

for (const p of projects) {
    const w = `projects[${p.id}]`;
    for (const f of ["name", "tagline", "origin", "period", "problem", "repo"]) if (!nonEmpty(p[f])) err(w, `missing ${f}`);
    if (!TIERS.has(p.tier)) err(w, `bad tier "${p.tier}"`);
    if (!STATUSES.has(p.status)) err(w, `bad status "${p.status}"`);
    if (!REPO_RE.test(p.repo ?? "")) err(w, `repo "${p.repo}" is not owner/name`);
    if (!/^[a-z0-9-]+$/.test(p.id)) err(w, "id must be lowercase kebab-case");
    if (!p.approach?.length) err(w, "needs at least one approach paragraph");
    if (!p.evidence?.length) err(w, "needs evidence");
    if (!p.limitations?.length) err(w, "needs limitations (what is not done)");
    if (!p.tech?.length) err(w, "needs tech");
    for (const e of p.evidence ?? []) {
        if (!nonEmpty(e.text)) err(w, "evidence item without text");
        if (e.source && e.source.startsWith("/")) err(w, `evidence source "${e.source}" must be repo-relative`);
    }
    for (const l of p.links ?? []) if (!/^https:\/\//.test(l.href)) err(w, `link "${l.label}" must be https`);
    if (!p.links?.length) err(w, "needs at least one link");
    for (const img of p.gallery?.items ?? []) {
        if (!nonEmpty(img.alt)) err(w, `image ${img.src} has no alt text`);
        if (!(img.width > 0 && img.height > 0)) err(w, `image ${img.src} has no dimensions`);
        if (!existsSync(join(root, "public", img.src))) err(w, `image file missing: public${img.src}`);
    }
}
for (const a of alsoBuilt) {
    if (!REPO_RE.test(a.repo)) err(`alsoBuilt[${a.name}]`, `repo "${a.repo}" is not owner/name`);
    if (!nonEmpty(a.line)) err(`alsoBuilt[${a.name}]`, "missing line");
}

// Names other data may use for a project (case-insensitive).
const knownNames = new Set([...projects.map((p) => p.name), ...alsoBuilt.map((a) => a.name)].map((n) => n.toLowerCase()));

// ─── Open source ─────────────────────────────────────────────
unique(mergedPRs, "url", "openSource");
const today = new Date().toISOString().slice(0, 10);
for (const pr of [...mergedPRs, inReview]) {
    const w = `openSource[${pr.project}#${pr.number}]`;
    const m = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)$/.exec(pr.url);
    if (!m) err(w, `url "${pr.url}" is not a GitHub pull request`);
    else if (Number(m[1]) !== pr.number) err(w, `url number ${m[1]} does not match #${pr.number}`);
    if (pr.merged) {
        if (!isDate(pr.merged)) err(w, `bad merged date "${pr.merged}"`);
        else if (pr.merged > today) err(w, `merged date ${pr.merged} is in the future`);
    }
    if (!nonEmpty(pr.title)) err(w, "missing title");
}

// ─── Deployments ─────────────────────────────────────────────
unique(deployments, "id", "deployments");
const recordIds = new Set(records.map((r) => r.id));
const CATS = new Set(["live", "device", "runtime"]);
const FORBIDDEN_DEPLOYMENT_FIELDS = ["commit", "commitMessage", "latencyChange", "observed", "date"];
for (const d of deployments) {
    const w = `deployments[${d.id}]`;
    if (!CATS.has(d.category)) err(w, `bad category "${d.category}"`);
    for (const f of ["repo", "summary", "impact", "runtime", "host"]) if (!nonEmpty(d[f])) err(w, `missing ${f}`);
    if (!knownNames.has(d.repo.toLowerCase())) err(w, `repo "${d.repo}" is not a known project`);
    if (d.liveUrl && !/^https:\/\//.test(d.liveUrl)) err(w, "liveUrl must be https");
    for (const id of d.relatedRecordIds ?? []) if (!recordIds.has(id)) err(w, `unknown relatedRecordIds entry "${id}"`);
    for (const f of FORBIDDEN_DEPLOYMENT_FIELDS) if (f in d) err(w, `field "${f}" was removed because it could not be verified`);
}

// ─── Blog ────────────────────────────────────────────────────
unique(BLOG_POSTS, "slug", "blog");
const BANNED_PHRASES = ["as an ai", "you asked about", "why this is brilliant", "the senior engineer take", "certainly!", "here's a breakdown"];
for (const post of BLOG_POSTS) {
    const w = `blog[${post.slug}]`;
    for (const f of ["title", "date", "readTime", "excerpt", "content"]) if (!nonEmpty(post[f])) err(w, `missing ${f}`);
    if (Number.isNaN(new Date(post.date).getTime())) err(w, `date "${post.date}" is not parseable`);
    if (!post.tags?.length) err(w, "needs tags");
    const lower = post.content.toLowerCase();
    for (const phrase of BANNED_PHRASES) if (lower.includes(phrase)) err(w, `contains assistant-style phrase "${phrase}"`);
    if ((post.content.match(/```/g) ?? []).length % 2 !== 0) err(w, "unbalanced code fences");
}

// ─── Decision / investigation records ───────────────────────
unique(records, "id", "records");
const KINDS = new Set(["decision", "investigation"]);
const STATUS = new Set(["adopted", "superseded", "reverted", "partial", "abandoned"]);
const VERDICT = new Set(["adopted", "confirmed", "partial", "rejected", "inconclusive"]);
const EVIDENCE = new Set(["commit", "file", "pr", "issue", "doc", "benchmark", "test", "release"]);
// Public sources only. Private-repo projects cite the published npm package instead.
const ALLOWED_HOSTS = ["https://github.com/", "https://unpkg.com/@ujjwaljain16/migratedb@", "https://registry.npmjs.org/@ujjwaljain16"];
const knownProjectNames = new Set([...projects.map((p) => p.name), ...alsoBuilt.map((a) => a.name), "Apache Superset", "Vitest", "Appwrite"]);
const knownProjectIds = new Set(projects.map((p) => p.id));
const PRIVATE_PROJECTS = new Set(["migrateDB"]); // no public source: evidence has no links
for (const r of records) {
    const w = `records[${r.id}]`;
    if (!/^[a-z0-9-]+$/.test(r.id)) err(w, "id must be lowercase kebab-case");
    if (!KINDS.has(r.kind)) err(w, `bad kind "${r.kind}"`);
    if (!knownProjectNames.has(r.project)) err(w, `project "${r.project}" does not match any project`);
    if (r.projectId && !knownProjectIds.has(r.projectId)) err(w, `projectId "${r.projectId}" is not a project page`);
    if (!nonEmpty(r.title) || r.title.length > 110) err(w, "title missing or over 110 characters");
    if (!isDate(r.date)) err(w, `bad date "${r.date}"`);
    else if (r.date > today) err(w, "date is in the future");
    if (!["recorded", "reconstructed"].includes(r.provenance)) err(w, "provenance must be recorded|reconstructed");
    if (!["stated", "inferred"].includes(r.rationaleSource)) err(w, "rationaleSource must be stated|inferred");
    if (!nonEmpty(r.verification)) err(w, "missing verification (how it was checked)");
    if (!nonEmpty(r.dateSource)) err(w, "missing dateSource");
    if (r.kind === "decision") {
        for (const f of ["context", "decision", "consequences"]) if (!nonEmpty(r[f])) err(w, `decision missing ${f}`);
        if (!STATUS.has(r.status)) err(w, `bad status "${r.status}"`);
        if (!Array.isArray(r.alternatives)) err(w, "alternatives must be an array");
        else if (r.alternatives.length === 0) warn(w, "no alternatives listed (a decision should name what it was chosen over)");
    } else {
        for (const f of ["question", "method", "result"]) if (!nonEmpty(r[f])) err(w, `investigation missing ${f}`);
        if (!VERDICT.has(r.verdict)) err(w, `bad verdict "${r.verdict}"`);
        if (r.measured && !(r.numbers?.length > 0)) err(w, "measured investigation needs numbers with sources");
        for (const n of r.numbers ?? []) if (!nonEmpty(n.source)) err(w, `number "${n.label}" has no source`);
    }
    if ((r.evidence?.length ?? 0) < 2) err(w, "needs at least 2 evidence items");
    if (!PRIVATE_PROJECTS.has(r.project) && !(r.evidence ?? []).some((e) => e.type === "commit" || e.type === "pr")) err(w, "needs at least one commit or pull request as evidence");
    for (const e of r.evidence ?? []) {
        if (!EVIDENCE.has(e.type)) err(w, `bad evidence type "${e.type}"`);
        if (!nonEmpty(e.note)) err(w, `evidence "${e.label}" has no note`);
        if (e.href && !ALLOWED_HOSTS.some((h) => e.href.startsWith(h))) err(w, `evidence link "${e.href}" is not from an allowed public host`);
        if (!e.href && !PRIVATE_PROJECTS.has(r.project)) err(w, `evidence "${e.label}" has no link (only private-repo projects may omit it)`);
        if (e.type === "commit" && e.href && !/\/commit\/[0-9a-f]{7,40}$/.test(e.href)) err(w, `commit link "${e.href}" is malformed`);
    }
}

// ─── Report ──────────────────────────────────────────────────
const line = (label, list) => {
    if (list.length === 0) return;
    console.log(`\n${label} (${list.length})`);
    for (const m of list) console.log(`  - ${m}`);
};
line("ERRORS", errors);
line("WARNINGS", warnings);
console.log(
    `\nvalidate-data: ${projects.length} projects, ${mergedPRs.length} merged PRs, ${deployments.length} deployments, ` +
        `${BLOG_POSTS.length} posts, ${records.filter((r) => r.kind === "decision").length} decisions, ${records.filter((r) => r.kind === "investigation").length} investigations: ` +
        `${errors.length} error(s), ${warnings.length} warning(s)`
);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
