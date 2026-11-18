import "server-only";

/**
 * Server-only GitHub access.
 *
 * The browser never talks to GitHub and never sees a token. Only public
 * endpoints are used, so even a token with extra scopes cannot leak private
 * data through this module. `GITHUB_TOKEN` is optional and only raises the
 * unauthenticated rate limit (60 req/h per IP).
 */

const USER = "Ujjwaljain16";
const API = "https://api.github.com";
const REVALIDATE_SECONDS = 600;

async function gh<T>(path: string): Promise<T | null> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
        const res = await fetch(`${API}${path}`, {
            headers,
            next: { revalidate: REVALIDATE_SECONDS },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            console.warn(`[github] ${res.status} ${path}`);
            return null;
        }
        return (await res.json()) as T;
    } catch (err) {
        console.warn(`[github] request failed ${path}:`, err instanceof Error ? err.message : "unknown error");
        return null;
    }
}

// ─── Summary metrics ─────────────────────────────────────

interface GhUser {
    created_at: string;
}

interface GhRepo {
    name: string;
    full_name: string;
    html_url: string;
    fork: boolean;
    archived: boolean;
    pushed_at: string | null;
}

interface GhCommit {
    html_url: string;
    commit: { message: string; author?: { date?: string }; committer?: { date?: string } };
}

export interface GitHubSummary {
    /** ISO date the GitHub account was created. */
    memberSince: string | null;
    /** Most recent commit authored by the user in a repository they own (non-fork, public). */
    lastPush: { repo: string; message: string; date: string; url: string } | null;
}

export async function getGitHubSummary(): Promise<GitHubSummary> {
    const [user, repos] = await Promise.all([
        gh<GhUser>(`/users/${USER}`),
        gh<GhRepo[]>(`/users/${USER}/repos?type=owner&sort=pushed&direction=desc&per_page=10`),
    ]);

    let lastPush: GitHubSummary["lastPush"] = null;
    const latest = repos?.find((r) => !r.fork && !r.archived);
    if (latest) {
        const commits = await gh<GhCommit[]>(
            `/repos/${latest.full_name}/commits?per_page=1&author=${USER}`
        );
        const c = commits?.[0];
        const date = c?.commit.author?.date ?? c?.commit.committer?.date;
        if (c && date) {
            lastPush = {
                repo: latest.name,
                message: c.commit.message.split("\n")[0],
                date,
                url: c.html_url,
            };
        }
    }

    return { memberSince: user?.created_at ?? null, lastPush };
}

// ─── Public activity ─────────────────────────────────────

interface GhEvent {
    id: string;
    type: string;
    created_at: string;
    repo: { name: string };
    payload: {
        ref?: string | null;
        ref_type?: string;
        action?: string;
        number?: number;
        // The public events feed now often sends a slim pull request (id, number and API url only): no title, no
        // html_url, no merged flag, and the action itself is "merged".
        pull_request?: { number?: number; title?: string | null; html_url?: string | null; merged?: boolean | null };
        issue?: { title: string; html_url: string };
        release?: { tag_name: string; html_url: string };
    };
}

export interface ActivityItem {
    id: string;
    date: string;
    /** `repo` for the owner's repos, `owner/repo` for other projects. */
    repo: string;
    text: string;
    url: string;
    /** How many identical events (same repository, same text, same UTC day) this row stands for. */
    count?: number;
}

/**
 * Newest first, with identical events on the same day folded into one row and counted ("pushed to main" three times
 * becomes one row with count 3). GitHub's feed is not strictly ordered, and a busy day otherwise fills the list with
 * repeats of one line.
 */
export function collapseActivity(items: ActivityItem[]): ActivityItem[] {
    const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
    const rows: ActivityItem[] = [];
    const byKey = new Map<string, ActivityItem>();
    for (const item of sorted) {
        const key = JSON.stringify([item.repo, item.text, item.date.slice(0, 10)]);
        const row = byKey.get(key);
        if (row) {
            row.count = (row.count ?? 1) + 1;
            continue;
        }
        const fresh = { ...item, count: 1 };
        byKey.set(key, fresh);
        rows.push(fresh);
    }
    return rows;
}

function toActivity(e: GhEvent): ActivityItem | null {
    const [owner, name] = e.repo.name.split("/");
    const repo = owner.toLowerCase() === USER.toLowerCase() ? name : e.repo.name;
    const repoUrl = `https://github.com/${e.repo.name}`;
    const base = { id: e.id, date: e.created_at, repo };
    const p = e.payload;

    switch (e.type) {
        case "PushEvent": {
            const branch = p.ref?.replace("refs/heads/", "") ?? "default branch";
            return { ...base, text: `pushed to ${branch}`, url: repoUrl };
        }
        case "PullRequestEvent": {
            if (!p.pull_request) return null;
            const pr = p.pull_request;
            const number = pr.number ?? p.number;
            const action = p.action === "closed" && pr.merged ? "merged" : p.action ?? "updated";
            const url = pr.html_url ?? (number ? `${repoUrl}/pull/${number}` : repoUrl);
            if (pr.title) return { ...base, text: `PR ${action}: ${pr.title}`, url };
            return { ...base, text: number ? `PR #${number} ${action}` : `PR ${action}`, url };
        }
        case "IssuesEvent":
            if (!p.issue) return null;
            return { ...base, text: `issue ${p.action}: ${p.issue.title}`, url: p.issue.html_url };
        case "ReleaseEvent":
            if (!p.release) return null;
            return { ...base, text: `released ${p.release.tag_name}`, url: p.release.html_url };
        case "CreateEvent":
            if (p.ref_type === "repository") return { ...base, text: "created repository", url: repoUrl };
            return null;
        default:
            return null;
    }
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[] | null> {
    const events = await gh<GhEvent[]>(`/users/${USER}/events/public?per_page=50`);
    if (!events) return null;
    return collapseActivity(events.map(toActivity).filter((a): a is ActivityItem => a !== null)).slice(0, limit);
}
