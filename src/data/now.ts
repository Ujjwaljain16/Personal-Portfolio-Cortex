import { githubSyncedAt, lastPushed, mergedPRs, openPRs } from "@/data/openSource";
import { formatDate } from "@/lib/utils";

/**
 * What is happening right now. Keep it short and true: every item names something
 * a visitor can check.
 *
 * Two kinds of item:
 *  - Generated, so they never need editing: open pull requests, recent merges, and the "last commit" date on
 *    repositories. They come from src/data/generated/github.json (`npm run sync:github`, run daily by CI).
 *  - Written by hand: the status words about work that has no public signal. `nowUpdated` is the date those were
 *    last reviewed; change it whenever they are edited.
 */

export interface NowItem {
    /** Where the work stands, e.g. "In review". */
    status: string;
    text: string;
    /** Internal path or absolute URL. Leave out for work with nothing public to link to. */
    href?: string;
    linkLabel?: string;
}

/** When the hand-written items below were last reviewed. */
export const nowUpdated = "2026-10-14";
/** When the generated items (pull requests, merges, last-commit dates) last changed. */
export const nowSyncedAt = githubSyncedAt.slice(0, 10);

const RECENT_DAYS = 45;

/** Merges from the last RECENT_DAYS before the sync, one item per project, newest project first. */
function recentMerges(): NowItem[] {
    const cutoff = new Date(githubSyncedAt).getTime() - RECENT_DAYS * 86_400_000;
    const byProject = new Map<string, typeof mergedPRs>();
    for (const pr of mergedPRs) {
        if (new Date(pr.merged).getTime() < cutoff) continue;
        byProject.set(pr.project, [...(byProject.get(pr.project) ?? []), pr]);
    }
    return [...byProject.entries()].map(([project, prs]) => {
        const latest = prs[0]; // mergedPRs is newest first
        const count = prs.length === 1 ? "A" : String(prs.length);
        return {
            status: "Just merged",
            text: `${count} ${project} pull request${prs.length === 1 ? "" : "s"} merged, the latest on ${formatDate(latest.merged)}: #${latest.number}, ${latest.title}.`,
            href: latest.url,
            linkLabel: "Pull request",
        };
    });
}

/** " Last commit Oct 15, 2026." for a repository the sync tracks, else nothing. */
function lastCommit(repo: string): string {
    const pushed = lastPushed(repo);
    return pushed ? ` Last commit ${formatDate(pushed)}.` : "";
}

export const nowItems: NowItem[] = [
    // Open pull requests come from src/data/openSource.ts so the two lists cannot disagree.
    ...openPRs.map((pr) => ({
        status: "In review",
        text: `${pr.project} #${pr.number}: ${pr.title}. ${pr.note}`,
        href: pr.url,
        linkLabel: "Pull request",
    })),
    ...recentMerges(),
    {
        status: "Active development",
        text: "LEXIS, a retrieval-augmented generation (RAG) system that is still a work in progress. Recent work replaces a placeholder entailment check with a real model and wires in cross-encoder reranking, which is off by default." + lastCommit("Ujjwaljain16/LEXIS"),
        href: "https://github.com/Ujjwaljain16/LEXIS",
        linkLabel: "Repository",
    },
    {
        status: "Active development",
        text: "OSS Hunter, an engine that scores a repository's issues for complexity with an LLM and ranks them by graph-propagated importance. Early stage, and the repository is private for now.",
    },
    {
        status: "Just published",
        text: "FlashFlow, a Go lab that replays routing policies on identical traffic to show why one collapses under load.",
        href: "/projects/flashflow",
        linkLabel: "Project page",
    },
    {
        status: "Just fixed",
        text: "A security and honesty pass over CampusSync, VaultTabs, RecoveryOS and AgentBrake, including AgentBrake's fail-open bugs.",
        href: "/decisions#ab-fail-closed-framing-and-config",
        linkLabel: "The AgentBrake record",
    },
];
