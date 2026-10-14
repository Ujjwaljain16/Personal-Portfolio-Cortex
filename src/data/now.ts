import { openPRs } from "@/data/openSource";

/**
 * What is happening right now. Keep it short and true: every item names something
 * a visitor can check, and `updated` is the date this list was last reviewed.
 * Change the date whenever the list is edited.
 */

export interface NowItem {
    /** Where the work stands, e.g. "In review". */
    status: string;
    text: string;
    /** Internal path or absolute URL. Leave out for work with nothing public to link to. */
    href?: string;
    linkLabel?: string;
}

export const nowUpdated = "2026-10-14";

export const nowItems: NowItem[] = [
    // Open pull requests come from src/data/openSource.ts so the two lists cannot disagree.
    ...openPRs.map((pr) => ({
        status: "In review",
        text: `${pr.project} #${pr.number}: ${pr.title}. ${pr.note}`,
        href: pr.url,
        linkLabel: "Pull request",
    })),
    {
        status: "Just merged",
        text: "Nine Apache Superset pull requests are merged, the latest two on 29 Sep 2026, and so is a crash-recovery fix in Metacog Hypergraph (14 Oct 2026) for a bug found and reported as #91.",
        href: "https://github.com/metacoglabs/hypergraph/pull/92",
        linkLabel: "Pull request",
    },
    {
        status: "Active development",
        text: "LEXIS, a retrieval-augmented generation (RAG) system that is still a work in progress. Recent work replaces a placeholder entailment check with a real model and wires in cross-encoder reranking, which is off by default.",
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
