import { githubSyncedAt, lastCommitBranch, lastCommitDate, openPRs } from "@/data/openSource";
import { formatDate } from "@/lib/utils";

/**
 * What is happening right now. Keep it short and true: every item names something
 * a visitor can check.
 *
 * Two kinds of item:
 *  - Generated, so they never need editing: open pull requests and the "last commit" date on
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
export const nowUpdated = "2026-11-17";
/** When the generated items (pull requests, merges, last-commit dates) last changed. */
export const nowSyncedAt = githubSyncedAt.slice(0, 10);

/** " Last commit Oct 15, 2026." (with the branch, when it is not the default one) for a repository the sync tracks, else nothing. */
function lastCommit(repo: string): string {
    const date = lastCommitDate(repo);
    const branch = lastCommitBranch(repo);
    return date ? ` Last commit ${formatDate(date)}${branch ? ` on the ${branch} branch` : ""}.` : "";
}

export const nowItems: NowItem[] = [
    {
        status: "Current focus",
        text: "Learning system design and data structures and algorithms.",
    },
    // Open pull requests come from src/data/openSource.ts so the two lists cannot disagree.
    ...openPRs.map((pr) => ({
        status: "In review",
        text: `${pr.project} #${pr.number}: ${pr.title}. ${pr.note}`,
        href: pr.url,
        linkLabel: "Pull request",
    })),
    {
        status: "Just released",
        text: "AgentBrake 2.0 is on npm (17 Nov 2026, now 2.0.1), published by CI with a provenance attestation: typed path and URL rules and secret-flow tracking, so the proxy can notice data read in one tool call leaving in a later one. The first npm release (1.0.0, February) fails open on unparseable input; 2.0 does not.",
        href: "https://github.com/Ujjwaljain16/AgentBrake",
        linkLabel: "Repository",
    },
    {
        status: "Just released",
        text: "SSE Observatory v2.0.0, released 15 Nov 2026: a diagnostics layer and command-line tool that explain why a Server-Sent Events stream stalled or lost events, with the evidence. The hosted demo runs it." + lastCommit("Ujjwaljain16/SSE-Observatory"),
        href: "https://github.com/Ujjwaljain16/SSE-Observatory/releases/tag/v2.0.0",
        linkLabel: "Release",
    },
    {
        status: "Active development",
        text: "FlashFlow, a Go lab that replays routing policies on identical traffic to show why one collapses under load.",
        href: "/projects/flashflow",
        linkLabel: "Project page",
    },
];
