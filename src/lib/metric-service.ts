import { gitHubService, GitHubService } from "./github-service";

export class MetricService {
    async getEngineeringTime(): Promise<string> {
        try {
            const earliestDate = await gitHubService.getEarliestRepoDate();
            if (earliestDate) {
                const diffTime = Math.abs(Date.now() - earliestDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const years = (diffDays / 365).toFixed(1);
                return `${years} years`;
            }
        } catch (e) {
            console.warn("Metric fetch failed", e);
        }
        return "2+ years";
    }

    async getLastCommit(): Promise<{ time: string; detail: string }> {
        try {
            const commit = await gitHubService.getLastCommit();
            if (commit) {
                return {
                    time: GitHubService.formatDuration(commit.date),
                    detail: `${commit.repo}: ${commit.message}`
                };
            }
        } catch (e) {
            console.warn("Commit fetch failed", e);
        }
        return { time: "--", detail: "No recent activity" };
    }
}

export const metricService = new MetricService();
