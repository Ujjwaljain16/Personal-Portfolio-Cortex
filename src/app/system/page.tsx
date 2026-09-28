import { SystemMetrics } from "@/components/system/SystemMetrics";
import { ProjectCard } from "@/components/system/ProjectCard";
import { ActivityFeed } from "@/components/system/ActivityFeed";
import { projects } from "@/data/projects";
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
                <p className="text-[14px] text-(--text-secondary)">
                    Projects I&apos;ve built, with their architecture, plus my recent public GitHub activity.
                </p>
            </header>

            <section aria-labelledby="status-heading">
                <h2 id="status-heading" className="text-label mb-3">STATUS</h2>
                <SystemMetrics summary={summary} />
            </section>

            <section aria-labelledby="projects-heading">
                <h2 id="projects-heading" className="text-label mb-3">PROJECTS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            </section>

            <section>
                <ActivityFeed items={activity} />
            </section>
        </div>
    );
}
