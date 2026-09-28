import Link from "next/link";
import { SystemMetrics } from "@/components/system/SystemMetrics";
import { ActivityFeed } from "@/components/system/ActivityFeed";
import { getGitHubSummary, getRecentActivity } from "@/lib/github";

// GitHub data is fetched on the server and cached; the browser never calls GitHub.
export const revalidate = 600;

export default async function SystemPage() {
    const [summary, activity] = await Promise.all([getGitHubSummary(), getRecentActivity(8)]);

    return (
        <div className="space-y-8">
            <header>
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2">SYSTEM</div>
                <h1 className="text-header mb-1">System Overview</h1>
                <p className="text-[14px] text-(--text-secondary) max-w-2xl">
                    Live-ish signals from my public GitHub account. For the work itself, see the{" "}
                    <Link href="/projects" className="underline hover:text-(--accent-primary)">
                        projects
                    </Link>
                    .
                </p>
            </header>

            <section aria-labelledby="status-heading">
                <h2 id="status-heading" className="text-label mb-3">STATUS</h2>
                <SystemMetrics summary={summary} />
            </section>

            <section>
                <ActivityFeed items={activity} />
            </section>
        </div>
    );
}
