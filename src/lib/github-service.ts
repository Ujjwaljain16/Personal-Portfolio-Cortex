// ─── Types ─────────────────────────────────────────────

export class GitHubService {
    private static readonly BASE_URL = "https://api.github.com";
    private username: string;
    private headers: HeadersInit;

    constructor(username: string) {
        this.username = username;
        const base: HeadersInit = { Accept: "application/vnd.github.v3+json" };
        const token = typeof window === "undefined"
            ? process.env.NEXT_PUBLIC_GITHUB_TOKEN
            : process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        if (token) (base as Record<string, string>)["Authorization"] = `token ${token}`;
        this.headers = base;
    }

    // ─── Core fetcher with error handling ───────────────
    private async ghFetch<T>(path: string): Promise<T | null> {
        try {
            const res = await fetch(`${GitHubService.BASE_URL}${path}`, { headers: this.headers, next: { revalidate: 120 } });
            if (!res.ok) { console.warn(`GitHub ${res.status}: ${path}`); return null; }
            return res.json() as Promise<T>;
        } catch (e) { console.error("GitHub fetch error:", e); return null; }
    }

    // ─── Methods ────────────────────────────────────────

    async getEarliestRepoDate(): Promise<Date | null> {
        const data = await this.ghFetch<{ created_at: string }[]>(
            `/users/${this.username}/repos?sort=created&direction=asc&per_page=1`
        );
        return data && data.length > 0 ? new Date(data[0].created_at) : null;
    }

    async getPublicRepoCount(): Promise<number> {
        const data = await this.ghFetch<{ public_repos: number }>(`/users/${this.username}`);
        return data?.public_repos ?? 0;
    }

    async getLastCommit(): Promise<{ repo: string; message: string; date: Date } | null> {
        // Strategy: fetch latest commit from each repo, pick the most recent.
        // Events API misses private repos without `repo` scope, so we query repos directly.
        try {
            // Fetch repos (authenticated = includes private repos)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const repos = await this.ghFetch<any[]>(
                `/user/repos?sort=pushed&direction=desc&per_page=5&type=all`
            );

            // Fallback: if /user/repos fails (no token / bad token), try public events
            if (!repos || repos.length === 0) {
                return this.getLastCommitFromEvents();
            }

            // The first repo in pushed-desc order has the most recent push
            for (const repo of repos) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const commits = await this.ghFetch<any[]>(
                    `/repos/${repo.full_name}/commits?per_page=1`
                );
                if (commits && commits.length > 0) {
                    const c = commits[0];
                    const repoName = repo.name;
                    const message = c.commit?.message?.split("\n")[0] || "commit";
                    const date = new Date(c.commit?.committer?.date || c.commit?.author?.date || repo.pushed_at);
                    return { repo: repoName, message, date };
                }
            }
            return null;
        } catch {
            return this.getLastCommitFromEvents();
        }
    }

    /** Fallback: use public events API (works without token) */
    private async getLastCommitFromEvents(): Promise<{ repo: string; message: string; date: Date } | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = await this.ghFetch<any[]>(
            `/users/${this.username}/events/public?per_page=30`
        );
        if (!events) return null;

        for (const event of events) {
            if (event.type === "PushEvent") {
                const repoName = event.repo.name.split("/")[1] || event.repo.name;
                let message = "pushed to " + (event.payload.ref?.replace("refs/heads/", "") || "repository");
                if (event.payload.commits?.length > 0) {
                    message = event.payload.commits[event.payload.commits.length - 1].message;
                }
                return { repo: repoName, message, date: new Date(event.created_at) };
            }
        }
        return null;
    }

    // ─── Helpers ─────────────────────────────────────────

    static formatDuration(startDate: Date): string {
        const now = new Date();
        const diffMs = Math.abs(now.getTime() - startDate.getTime());
        const mins = Math.floor(diffMs / 60_000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}+ years`;
    }

    static formatDurationLong(startDate: Date): string {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 365) {
            const years = Math.floor(diffDays / 365);
            return `${years}+ years`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `${months} months`;
        }
    }
}

// Singleton instance
export const gitHubService = new GitHubService("Ujjwaljain16");
