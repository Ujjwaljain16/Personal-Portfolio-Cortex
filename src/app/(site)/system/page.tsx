import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ActivityFeed } from "@/components/system/ActivityFeed";
import { getGitHubSummary, getRecentActivity } from "@/lib/github";
import { nowItems, nowSyncedAt, nowUpdated } from "@/data/now";
import { mergedPRs } from "@/data/openSource";
import { STATUS_LABEL, projects, type ProjectStatus } from "@/data/projects";
import { formatDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

// GitHub data is fetched on the server and cached; the browser never calls GitHub.
export const revalidate = 600;

export const metadata = pageMetadata({
    title: "System overview",
    description: "Signals from my public GitHub account: the latest commit, what I am working on now, and recent public activity.",
    path: "/system",
});

const memberSinceFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** A numbered section, the same shape as on the project pages. */
function Section({
    id,
    n,
    title,
    aside,
    first = false,
    children,
}: {
    id: string;
    n: number;
    title: string;
    aside?: ReactNode;
    /** The first section sits under the status strip, which already draws the line above it. */
    first?: boolean;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={`${id}-heading`} className={first ? "" : "border-t border-(--border-default) pt-10"}>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`${id}-heading`} className="flex items-baseline gap-3 text-[21px] md:text-[23px] font-semibold tracking-[-0.02em] text-foreground">
                    <span className="font-mono text-[12px] font-normal tracking-normal text-(--text-muted)">{String(n).padStart(2, "0")}</span>
                    {title}
                </h2>
                {aside}
            </div>
            {children}
        </section>
    );
}

export default async function SystemPage() {
    const [summary, activity] = await Promise.all([getGitHubSummary(), getRecentActivity(10)]);
    const since = summary.memberSince ? memberSinceFormatter.format(new Date(summary.memberSince)) : "—";
    const last = summary.lastPush;

    const byStatus = (["shipped", "ongoing", "prototype", "in-progress"] as ProjectStatus[])
        .map((s) => ({ s, n: projects.filter((p) => p.status === s).length }))
        .filter((x) => x.n > 0);

    return (
        <div className="pb-16">
            <div className="max-w-[62rem] space-y-14">
                <header className="space-y-5 pt-2">
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-(--text-muted)">System</p>
                    <h1 className="text-[2.5rem] leading-[1.05] md:text-[3.25rem] font-semibold tracking-[-0.035em] text-foreground">What&apos;s running</h1>
                    <p className="max-w-[44rem] text-[17px] md:text-[18px] leading-[1.6] text-(--text-secondary)">
                        Signals from my public GitHub account: the latest commit, what I am working on now, and recent public activity.
                        For the work itself, see the{" "}
                        <Link href="/projects" className="text-foreground underline decoration-(--border-hover) underline-offset-4 hover:decoration-(--accent-primary)">
                            projects
                        </Link>
                        .
                    </p>
                </header>

                <dl className="facts-strip grid grid-cols-2 lg:grid-cols-4">
                    <div>
                        <dt>Latest public commit</dt>
                        <dd>
                            <span className="metric-value block text-[22px] leading-tight">{last ? formatDate(last.date) : "—"}</span>
                            {last ? (
                                <a
                                    href={last.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1.5 block text-[13px] leading-relaxed text-(--text-secondary) hover:text-foreground line-clamp-2 transition-colors"
                                >
                                    <span className="font-mono text-[12px] text-(--text-muted)">{last.repo}</span> {last.message}
                                </a>
                            ) : (
                                <span className="mt-1.5 block text-[13px] text-(--text-secondary)">GitHub data is unavailable right now.</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt>Projects</dt>
                        <dd>
                            <span className="metric-value block text-[22px] leading-tight">{projects.length}</span>
                            <span className="mt-1.5 block text-[13px] leading-relaxed text-(--text-secondary)">
                                {byStatus.map((x) => `${x.n} ${STATUS_LABEL[x.s].toLowerCase()}`).join(" · ")}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt>Merged upstream</dt>
                        <dd>
                            <span className="metric-value block text-[22px] leading-tight">{mergedPRs.length}</span>
                            <Link href="/#open-source" className="mt-1.5 block text-[13px] text-(--text-secondary) hover:text-foreground transition-colors">
                                pull requests to projects I don&apos;t own
                            </Link>
                        </dd>
                    </div>
                    <div>
                        <dt>On GitHub since</dt>
                        <dd>
                            <span className="metric-value block text-[22px] leading-tight">{since}</span>
                            <a
                                href="https://github.com/Ujjwaljain16"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 block font-mono text-[12px] text-(--text-secondary) hover:text-foreground transition-colors"
                            >
                                @Ujjwaljain16
                            </a>
                        </dd>
                    </div>
                </dl>

                <Section
                    id="now"
                    n={1}
                    first
                    title="Now"
                    aside={<span className="font-mono text-[12px] text-(--text-muted)">reviewed {formatDate(nowUpdated)}</span>}
                >
                    <ul className="now-list">
                        {nowItems.map((item) => (
                            <li key={item.text}>
                                <span className="now-status">{item.status}</span>
                                <div className="min-w-0 space-y-2">
                                    <p>{item.text}</p>
                                    {item.href &&
                                        (item.href.startsWith("/") ? (
                                            <Link href={item.href} className="now-link">
                                                {item.linkLabel ?? "Details"}
                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                            </Link>
                                        ) : (
                                            <a href={item.href} target="_blank" rel="noopener noreferrer" className="now-link">
                                                {item.linkLabel ?? "Details"}
                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                            </a>
                                        ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 text-[13px] text-(--text-muted)">
                        Pull requests and commit dates are synced from GitHub daily (last on {formatDate(nowSyncedAt)}); the rest is written by
                        hand.
                    </p>
                </Section>

                <Section id="activity" n={2} title="Recent public activity" aside={<span className="font-mono text-[12px] text-(--text-muted)">live</span>}>
                    <ActivityFeed items={activity} />
                </Section>
            </div>
        </div>
    );
}
