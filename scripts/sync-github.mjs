// Refreshes src/data/generated/github.json from the GitHub API: open-source pull requests and when each
// portfolio project's repository was last pushed to. Only public data is read.
//
//   node scripts/sync-github.mjs           write the file if anything changed
//   node scripts/sync-github.mjs --check   exit 1 if the file is out of date (writes nothing)
//
// Token: GITHUB_TOKEN (provided by Actions), else the local `gh` login. GraphQL needs one even for public data.
// The file's `syncedAt` only moves when the data does, so an unchanged day produces no diff and no commit.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OWNER, normalize, render } from "./lib/github-sync.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "src", "data", "generated", "github.json");
const checkOnly = process.argv.includes("--check");
/** Repositories shown on the site that are not in src/data/projects.ts (for example work in progress mentioned under "Now"). */
const EXTRA_REPOS = ["Ujjwaljain16/LEXIS"];
/** Repositories whose active work is on a branch other than the default one (the default branch is a released version). */
const DEV_BRANCH = {};  // for example { "owner/repo": "v2" } while v2 is developed beside a released main

function token() {
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    try {
        return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
    } catch {
        throw new Error("No GITHUB_TOKEN and no `gh` login: cannot call the GitHub API.");
    }
}

const TOKEN = token();

async function graphql(query, variables = {}) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "portfolio-sync" },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(30_000),
        });
        if (res.status >= 500 && attempt < 3) {
            await new Promise((r) => setTimeout(r, 2000 * attempt));
            continue;
        }
        const json = await res.json();
        // A repository that is private or deleted returns an error for its alias but still data for the rest.
        if (json.errors && !json.data) throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
        return json.data;
    }
    throw new Error("GitHub GraphQL unavailable after 3 attempts");
}

async function fetchPullRequests() {
    const query = `query($login:String!,$after:String){ user(login:$login){ pullRequests(first:50, after:$after,
      states:[MERGED,OPEN], orderBy:{field:CREATED_AT,direction:DESC}){ pageInfo{hasNextPage endCursor}
      nodes{ number title url state isDraft createdAt updatedAt mergedAt reviewDecision bodyText
        repository{ nameWithOwner stargazerCount isPrivate owner{login} } } } } }`;
    const nodes = [];
    let after = null;
    do {
        const data = await graphql(query, { login: OWNER, after });
        const page = data.user.pullRequests;
        nodes.push(...page.nodes);
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    return nodes;
}

async function fetchRepoActivity() {
    const { projects } = await import("../src/data/projects.ts");
    const repos = [...new Set([...projects.map((p) => p.repo), ...EXTRA_REPOS])].filter((r) => r.toLowerCase().startsWith(`${OWNER.toLowerCase()}/`));
    const fields = repos
        .map((r, i) => {
            const ref = DEV_BRANCH[r] ? `ref(qualifiedName:"refs/heads/${DEV_BRANCH[r]}")` : "defaultBranchRef";
            return `r${i}: repository(owner:"${r.split("/")[0]}", name:"${r.split("/")[1]}"){ isArchived ${ref}{ target{ ... on Commit{ committedDate } } } }`;
        })
        .join(" ");
    const data = await graphql(`query{ ${fields} }`);
    const out = {};
    repos.forEach((r, i) => {
        const node = data[`r${i}`];
        // The default branch's newest commit, not the last push: bots such as Dependabot push branches constantly.
        const committed = (node?.defaultBranchRef ?? node?.ref)?.target?.committedDate;
        if (committed) out[r] = { committed: committed.slice(0, 10), ...(DEV_BRANCH[r] ? { branch: DEV_BRANCH[r] } : {}), archived: node.isArchived };
    });
    return out;
}

const [nodes, repos] = await Promise.all([fetchPullRequests(), fetchRepoActivity()]);
const { merged, open } = normalize(nodes);
const body = { merged, open, repos };

let previous = null;
if (existsSync(OUT)) previous = JSON.parse(readFileSync(OUT, "utf8"));
const unchanged = previous && render({ merged: previous.merged, open: previous.open, repos: previous.repos }) === render(body);

// An unchanged week still gets a new timestamp. That keeps the page's "synced" date honest, and it is the repository
// activity GitHub needs to see to avoid disabling scheduled workflows after 60 quiet days in a public repository.
const HEARTBEAT_DAYS = 7;
const heartbeatDue = previous && Date.now() - Date.parse(previous.syncedAt) > HEARTBEAT_DAYS * 86_400_000;

if (unchanged && !heartbeatDue) {
    console.log(`up to date: ${merged.length} merged, ${open.length} open, ${Object.keys(repos).length} repositories`);
    process.exit(0);
}
if (checkOnly) {
    if (unchanged) process.exit(0); // only the timestamp is old, which a check does not care about
    console.error("src/data/generated/github.json is out of date; run `node scripts/sync-github.mjs`.");
    process.exit(1);
}
writeFileSync(OUT, render({ syncedAt: new Date().toISOString(), ...body }));
if (unchanged) console.log("no data changes; refreshed the sync timestamp (weekly heartbeat)");
const before = new Set((previous?.merged ?? []).map((p) => p.url));
const added = merged.filter((p) => !before.has(p.url));
console.log(`updated: ${merged.length} merged (${added.length} new), ${open.length} open, ${Object.keys(repos).length} repositories`);
for (const p of added) console.log(`  + ${p.project} #${p.number} ${p.title}`);
