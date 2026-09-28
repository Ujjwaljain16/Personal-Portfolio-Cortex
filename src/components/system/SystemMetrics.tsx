import { Clock, GitCommit, Layers, Target } from "lucide-react";
import { projects } from "@/data/projects";
import type { GitHubSummary } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { MetricCard } from "@/components/system/MetricCard";

const memberSinceFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

export function SystemMetrics({ summary }: { summary: GitHubSummary }) {
    const since = summary.memberSince ? memberSinceFormatter.format(new Date(summary.memberSince)) : "—";
    const last = summary.lastPush;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="On GitHub since" value={since} icon={Clock} />
            <MetricCard label="Documented projects" value={projects.length} icon={Layers} />
            <MetricCard
                label="Latest public commit"
                value={last ? formatDate(last.date) : "—"}
                hint={last ? `${last.repo}: ${last.message}` : "GitHub data unavailable right now"}
                href={last?.url}
                icon={GitCommit}
            />
            <MetricCard label="Current focus" value="System design" hint="Go · Spring Boot" icon={Target} />
        </div>
    );
}
