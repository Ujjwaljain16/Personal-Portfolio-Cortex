"use client";

import { SystemMetrics } from "@/components/system/SystemMetrics";
import { ProjectCard } from "@/components/system/ProjectCard";
import { ActivityFeed } from "@/components/system/ActivityFeed";
import { projects } from "@/data/projects";

export default function SystemPage() {

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-(--text-muted) mb-2 opacity-60">SYSTEM</div>
        <h1 className="text-header mb-1">System Overview</h1>
        <p className="text-sm text-(--text-secondary)">
          Real-time status and metrics across all active systems
        </p>
      </div>

      {/* Metrics Grid */}
      <section>
        <div className="text-label mb-3">STATUS</div>
        <SystemMetrics />
      </section>

      {/* Active Projects */}
      <section>
        <div className="text-label mb-3">ACTIVE SYSTEMS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              status={project.status}
              description={project.description}
              tech={project.tech}
              architectureSummary={project.architectureSummary}
              link={project.link}
            />
          ))}
        </div>
      </section>

      {/* Activity Feed — Real GitHub Events */}
      <section>
        <ActivityFeed maxItems={8} />
      </section>
    </div>
  );
}
