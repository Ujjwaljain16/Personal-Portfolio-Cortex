// Finds links in the site's data that no longer work: evidence commits and files that moved, pull requests, live
// deployments. It reports; it never edits anything, because deciding what a dead link should become is a judgement.
//
//   node scripts/check-links.mjs
//
// GitHub links are checked through the API (a token raises the limit to 5,000 an hour; GITHUB_TOKEN in CI, else the
// local `gh` login, else unauthenticated and slow). Other hosts get a HEAD request, then GET if HEAD is refused.
// Exit code 1 when anything is dead or unreachable. Sites that block automated requests (403/429) are reported
// as skipped, not as failures.

import { execFileSync } from "node:child_process";

const { records } = await import("../src/data/records.ts");
const { projects, alsoBuilt, sourceUrl } = await import("../src/data/projects.ts");
const { deployments } = await import("../src/data/deployments.ts");
const openSource = await import("../src/data/openSource.ts");

function token() {
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    try {
        return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
        return "";
    }
}
const TOKEN = token();

// ─── Collect ────────────────────────────────────────────────
const urls = new Map(); // url -> where it came from
const note = (url, from) => {
    const clean = url.replace(/[.,;]+$/, "");
    if (!urls.has(clean)) urls.set(clean, from);
};
function walk(value, from) {
    if (typeof value === "string") for (const m of value.matchAll(/https:\/\/[^\s"<>)\]]+/g)) note(m[0], from);
    else if (Array.isArray(value)) value.forEach((v) => walk(v, from));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => walk(v, from));
}
walk(records.map((r) => ({ ...r })), "records");
walk([projects, alsoBuilt], "projects");
walk(deployments, "deployments");
walk([openSource.mergedPRs, openSource.openPRs], "open source");
for (const p of projects) for (const e of p.evidence ?? []) if (e.source) note(sourceUrl(p.repo, e.source), `projects[${p.id}] evidence`);

// ─── Check ──────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOT_BLOCKING = new Set(["medium.com", "www.linkedin.com", "linkedin.com", "twitter.com", "x.com"]);

async function request(url, init = {}, attempts = 3) {
    let last;
    for (let i = 1; i <= attempts; i++) {
        try {
            const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000), ...init });
            if (res.status === 429 || res.status === 403) {
                const wait = Number(res.headers.get("retry-after")) || 2 * i;
                if (i < attempts) {
                    await sleep(Math.min(wait, 30) * 1000);
                    continue;
                }
            }
            if (res.status >= 500 && i < attempts) {
                await sleep(1500 * i);
                continue;
            }
            return res;
        } catch (e) {
            last = e;
            await sleep(1500 * i);
        }
    }
    throw last ?? new Error("request failed");
}

/** Maps a github.com URL to the API call that proves the thing it points at exists. null = not recognised. */
function githubApi(url) {
    const u = new URL(url);
    const [owner, repo, kind, ...rest] = u.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    const base = `https://api.github.com/repos/${owner}/${repo}`;
    if (!kind) return base;
    if (kind === "commit") return `${base}/commits/${rest[0]}`;
    if (kind === "pull") return `${base}/pulls/${rest[0]}`;
    if (kind === "issues") return `${base}/issues/${rest[0]}`;
    if (kind === "blob" || kind === "tree") {
        const [ref, ...path] = rest;
        return `${base}/contents/${path.map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`;
    }
    if (kind === "releases" && rest[0] === "tag") return `${base}/releases/tags/${rest.slice(1).join("/")}`;
    return null;
}

/** For a dead github.com/<o>/<r>/blob/<ref>/<path> link: the same file pinned to the last commit that still had it. */
async function pinnedSuggestion(url) {
    const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/[^/]+\/(.+)$/.exec(url);
    if (!m) return "";
    const [, owner, repo, path] = m;
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-link-check", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) };
    try {
        const log = await request(`https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`, { headers });
        const last = (await log.json())?.[0];
        const parent = last?.parents?.[0]?.sha;
        if (!parent) return "";
        const there = await request(`https://api.github.com/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${parent}`, { headers });
        return there.ok ? `https://github.com/${owner}/${repo}/blob/${parent}/${path}` : "";
    } catch {
        return "";
    }
}

async function check(url) {
    const host = new URL(url).host;
    // npmjs.com refuses automated requests; the registry says the same thing (does the package exist) without that.
    const npm = host === "www.npmjs.com" ? /^\/package\/(.+)$/.exec(new URL(url).pathname) : null;
    if (npm) {
        const res = await request(`https://registry.npmjs.org/${npm[1].replace("/", "%2F")}`, { method: "HEAD" });
        return res.ok ? { ok: true } : { ok: false, why: `npm registry says ${res.status}` };
    }
    const api = host === "github.com" ? githubApi(url) : null;
    if (api) {
        const headers = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-link-check" };
        if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
        const res = await request(api, { headers });
        if (res.ok) return { ok: true };
        if (res.status === 403 || res.status === 429) return { skipped: `GitHub API limit (${res.status})` };
        const fix = res.status === 404 ? await pinnedSuggestion(url) : "";
        return { ok: false, why: `GitHub says ${res.status}`, fix };
    }
    let res = await request(url, { method: "HEAD" });
    if (res.status === 405 || res.status === 403 || res.status === 400 || res.status === 501) res = await request(url, { method: "GET" });
    if (res.ok) return { ok: true };
    if ((res.status === 403 || res.status === 429 || res.status === 999) && BOT_BLOCKING.has(host)) return { skipped: `${host} blocks automated checks` };
    return { ok: false, why: `HTTP ${res.status}` };
}

const dead = [];
const skipped = [];
const queue = [...urls.entries()];
let done = 0;
async function worker() {
    for (let item = queue.shift(); item; item = queue.shift()) {
        const [url, from] = item;
        try {
            const r = await check(url);
            if (r.skipped) skipped.push({ url, why: r.skipped });
            else if (!r.ok) dead.push({ url, from, why: r.why, fix: r.fix });
        } catch (e) {
            // A site that drops the connection of an automated client is blocking it, the same as answering 403.
            if (BOT_BLOCKING.has(new URL(url).host)) skipped.push({ url, why: `${new URL(url).host} drops automated connections` });
            else dead.push({ url, from, why: `unreachable: ${e instanceof Error ? e.message : "unknown error"}` });
        }
        if (++done % 100 === 0) console.log(`  checked ${done}/${urls.size}`);
    }
}
await Promise.all(Array.from({ length: 8 }, worker));

console.log(`\ncheck-links: ${urls.size} links, ${dead.length} dead or unreachable, ${skipped.length} skipped`);
for (const s of skipped) console.log(`  skipped  ${s.url}  (${s.why})`);
for (const d of dead) {
    console.log(`  DEAD     ${d.url}  [${d.from}]  ${d.why}`);
    if (d.fix) console.log(`           last version of that file: ${d.fix}`);
}
if (dead.length) process.exit(1);
